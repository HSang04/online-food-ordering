package com.ths.onlinefood.delivery.service;

import com.graphhopper.GraphHopper;
import com.graphhopper.storage.Graph;
import com.graphhopper.storage.NodeAccess;
import com.graphhopper.storage.index.LocationIndex;
import com.graphhopper.storage.index.Snap;
import com.graphhopper.util.EdgeIterator;
import com.ths.onlinefood.delivery.model.DeliveryRoute;
import com.ths.onlinefood.delivery.model.RouteStep;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class DijkstraService {
    
    private final GraphHopper graphHopper;
    
    /**
     * ================================
     * PUBLIC API - Tìm đường từ GPS coordinates
     * ================================
     */
    public DeliveryRoute findShortestPath(Double latStart, Double lonStart, 
                                          Double latEnd, Double lonEnd) {
        
        log.info("🔍 Tìm đường: ({}, {}) → ({}, {})", 
                 latStart, lonStart, latEnd, lonEnd);
        
        try {
            Graph graph = graphHopper.getBaseGraph();
            LocationIndex locationIndex = graphHopper.getLocationIndex();
            
            // Bước 1: Map GPS → OSM Node ID
            int startNode = findNearestNode(locationIndex, latStart, lonStart);
            int endNode = findNearestNode(locationIndex, latEnd, lonEnd);
            
            if (startNode == -1 || endNode == -1) {
                log.error("❌ Không tìm thấy node OSM gần vị trí");
                return createFallbackRoute(latStart, lonStart, latEnd, lonEnd);
            }
            
            log.info("📍 Start Node: {} | End Node: {}", startNode, endNode);
            
            // Bước 2: Chạy thuật toán Dijkstra
            PathResult pathResult = dijkstra(graph, startNode, endNode);
            
            if (pathResult == null) {
                log.error("❌ Không tìm thấy đường đi");
                return createFallbackRoute(latStart, lonStart, latEnd, lonEnd);
            }
            
            // Bước 3: Build DeliveryRoute từ kết quả
            DeliveryRoute route = buildRouteFromPath(
                graph, pathResult, latStart, lonStart, latEnd, lonEnd
            );
            
            log.info("✅ Thành công: {:.2f} km, {} nodes", 
                     route.getTotalDistance(), pathResult.path.size());
            
            return route;
            
        } catch (Exception e) {
            log.error("❌ Lỗi tìm đường: ", e);
            return createFallbackRoute(latStart, lonStart, latEnd, lonEnd);
        }
    }
    
    /**
     * ================================
     * DIJKSTRA ALGORITHM - Pure Implementation
     * ================================
     * Bạn có thể thay thế method này bằng A*, Bellman-Ford, etc.
     */
    private PathResult dijkstra(Graph graph, int startNode, int endNode) {
        log.info("🚀 Dijkstra: {} → {}", startNode, endNode);
        
        // Cấu trúc dữ liệu
        Map<Integer, Double> distances = new HashMap<>();
        Map<Integer, Integer> previous = new HashMap<>();
        Set<Integer> visited = new HashSet<>();
        
        // Priority Queue: (node, distance)
        PriorityQueue<NodeDistance> pq = new PriorityQueue<>(
            Comparator.comparingDouble(nd -> nd.distance)
        );
        
        // Khởi tạo
        distances.put(startNode, 0.0);
        pq.offer(new NodeDistance(startNode, 0.0));
        
        int iterations = 0;
        int maxIterations = 1000000; // Giới hạn để tránh loop vô hạn
        
        // ===== DIJKSTRA MAIN LOOP =====
        while (!pq.isEmpty() && iterations < maxIterations) {
            NodeDistance current = pq.poll();
            int currentNode = current.node;
            double currentDist = current.distance;
            
            iterations++;
            
            // Skip nếu đã visit
            if (visited.contains(currentNode)) {
                continue;
            }
            
            visited.add(currentNode);
            
            // Log progress
            if (iterations % 10000 == 0) {
                log.debug("📊 Iteration {}: node {}, dist {:.2f} km", 
                         iterations, currentNode, currentDist / 1000);
            }
            
            // ✅ TÌM THẤY ĐÍCH!
            if (currentNode == endNode) {
                log.info("🎯 Tìm thấy đích sau {} iterations", iterations);
                return reconstructPath(startNode, endNode, previous, distances);
            }
            
            // Duyệt tất cả các cạnh kề (neighbors)
            EdgeIterator edgeIter = graph.createEdgeExplorer().setBaseNode(currentNode);
            
            while (edgeIter.next()) {
                int neighbor = edgeIter.getAdjNode();
                
                // Skip nếu đã visit
                if (visited.contains(neighbor)) {
                    continue;
                }
                
                // Lấy khoảng cách cạnh (meters)
                double edgeDistance = edgeIter.getDistance();
                double newDistance = currentDist + edgeDistance;
                double oldDistance = distances.getOrDefault(neighbor, Double.MAX_VALUE);
                
                // ===== RELAXATION =====
                if (newDistance < oldDistance) {
                    distances.put(neighbor, newDistance);
                    previous.put(neighbor, currentNode);
                    pq.offer(new NodeDistance(neighbor, newDistance));
                }
            }
        }
        
        // Không tìm thấy đường
        log.error("❌ Dijkstra failed sau {} iterations", iterations);
        return null;
    }
    
    /**
     * ================================
     * HELPER METHODS
     * ================================
     */
    
    /**
     * Tìm OSM node gần nhất với GPS coordinate
     */
    private int findNearestNode(LocationIndex locationIndex, Double lat, Double lon) {
        Snap snap = locationIndex.findClosest(lat, lon, edgeState -> true);
        
        if (!snap.isValid()) {
            log.warn("⚠️ Không tìm thấy node OSM gần ({}, {})", lat, lon);
            return -1;
        }
        
        int nodeId = snap.getClosestNode();
        double distance = snap.getQueryDistance();
        
        log.debug("📍 GPS ({}, {}) → Node {} (cách {:.0f}m)", 
                 lat, lon, nodeId, distance);
        
        return nodeId;
    }
    
    /**
     * Reconstruct path từ kết quả Dijkstra
     */
    private PathResult reconstructPath(int startNode, int endNode,
                                      Map<Integer, Integer> previous,
                                      Map<Integer, Double> distances) {
        
        List<Integer> path = new ArrayList<>();
        Integer current = endNode;
        
        // Trace ngược từ đích về nguồn
        while (current != null) {
            path.add(0, current);
            current = previous.get(current);
        }
        
        // Validate path
        if (path.isEmpty() || path.get(0) != startNode) {
            log.error("❌ Path không hợp lệ");
            return null;
        }
        
        double totalDistanceMeters = distances.get(endNode);
        double totalDistanceKm = totalDistanceMeters / 1000.0;
        
        PathResult result = new PathResult();
        result.path = path;
        result.totalDistance = totalDistanceKm;
        
        log.info("📊 Path: {} nodes, {:.2f} km", path.size(), totalDistanceKm);
        
        return result;
    }
    
    /**
     * Build DeliveryRoute từ path
     */
    private DeliveryRoute buildRouteFromPath(Graph graph, PathResult pathResult,
                                            Double latStart, Double lonStart,
                                            Double latEnd, Double lonEnd) {
        
        NodeAccess nodeAccess = graph.getNodeAccess();
        
        DeliveryRoute route = new DeliveryRoute();
        List<double[]> coordinates = new ArrayList<>();
        List<RouteStep> steps = new ArrayList<>();
        
        // Thêm điểm bắt đầu thực tế
        coordinates.add(new double[]{latStart, lonStart});
        
        // Thêm tọa độ của các nodes trên đường đi
        for (int i = 0; i < pathResult.path.size(); i++) {
            int nodeId = pathResult.path.get(i);
            double lat = nodeAccess.getLat(nodeId);
            double lon = nodeAccess.getLon(nodeId);
            coordinates.add(new double[]{lat, lon});
            
            // Tạo step nếu không phải node cuối
            if (i < pathResult.path.size() - 1) {
                int nextNodeId = pathResult.path.get(i + 1);
                double nextLat = nodeAccess.getLat(nextNodeId);
                double nextLon = nodeAccess.getLon(nextNodeId);
                
                double stepDistance = calculateDistance(lat, lon, nextLat, nextLon);
                
                RouteStep step = new RouteStep();
                step.setInstruction(String.format("Đi %.0f mét", stepDistance * 1000));
                step.setDistance(stepDistance);
                step.setDuration(stepDistance / 25.0 * 60.0); // 25km/h
                step.setStartCoordinate(new double[]{lat, lon});
                step.setEndCoordinate(new double[]{nextLat, nextLon});
                
                steps.add(step);
            }
        }
        
        // Thêm điểm kết thúc thực tế
        coordinates.add(new double[]{latEnd, lonEnd});
        
        route.setCoordinates(coordinates);
        route.setTotalDistance(pathResult.totalDistance);
        route.setEstimatedDuration(pathResult.totalDistance / 25.0 * 60.0); // 25 km/h
        route.setRouteSummary(String.format(
            "Dijkstra: %.2f km qua %d điểm", 
            pathResult.totalDistance, 
            pathResult.path.size()
        ));
        route.setSteps(steps);
//        route.setNodes(new ArrayList<>());
        
        return route;
    }
    
    /**
     * Tạo route fallback (đường thẳng) khi không tìm được đường
     */
    private DeliveryRoute createFallbackRoute(Double latStart, Double lonStart, 
                                             Double latEnd, Double lonEnd) {
        
        DeliveryRoute route = new DeliveryRoute();
        
        List<double[]> coordinates = new ArrayList<>();
        coordinates.add(new double[]{latStart, lonStart});
        coordinates.add(new double[]{latEnd, lonEnd});
        
        Double distance = calculateDistance(latStart, lonStart, latEnd, lonEnd);
        
        route.setCoordinates(coordinates);
        route.setTotalDistance(distance);
        route.setEstimatedDuration(distance / 25.0 * 60.0);
        route.setRouteSummary(String.format(
            "⚠️ Khoảng cách đường chim bay: %.2f km (Không tìm thấy đường trên bản đồ)", 
            distance
        ));
        route.setSteps(new ArrayList<>());
//        route.setNodes(new ArrayList<>());
        
        log.warn("⚠️ Fallback route: {:.2f} km", distance);
        
        return route;
    }
    
    /**
     * Haversine formula - Tính khoảng cách giữa 2 GPS coordinates
     */
    public Double calculateDistance(Double lat1, Double lon1, Double lat2, Double lon2) {
        final int R = 6371; // Bán kính Trái Đất (km)
        
        Double latDistance = Math.toRadians(lat2 - lat1);
        Double lonDistance = Math.toRadians(lon2 - lon1);
        
        Double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        
        Double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return R * c;
    }
    
    /**
     * ================================
     * INNER CLASSES
     * ================================
     */
    
    /**
     * Node + Distance trong priority queue
     */
    private static class NodeDistance {
        int node;
        double distance;
        
        NodeDistance(int node, double distance) {
            this.node = node;
            this.distance = distance;
        }
    }
    
    /**
     * Kết quả của thuật toán tìm đường
     */
    private static class PathResult {
        List<Integer> path;         // Danh sách node IDs
        double totalDistance;       // km
    }
}