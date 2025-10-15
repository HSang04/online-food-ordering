package com.ths.onlinefood.delivery.service;

import com.graphhopper.GraphHopper;
import com.graphhopper.storage.Graph;
import com.graphhopper.storage.index.LocationIndex;
import com.graphhopper.storage.index.Snap;
import com.ths.onlinefood.delivery.model.DeliveryRoute;
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
     * DIJKSTRA THUẦN TÚY - Dùng dữ liệu OSM từ GraphHopper
     */
    public DeliveryRoute findShortestPath(Double latStart, Double lonStart, 
                                          Double latEnd, Double lonEnd) {
        
        log.info("🔍 Dijkstra: ({}, {}) → ({}, {})", 
                 latStart, lonStart, latEnd, lonEnd);
        
        try {
            // Bước 1: Lấy graph từ GraphHopper
            Graph graph = graphHopper.getBaseGraph();
            LocationIndex locationIndex = graphHopper.getLocationIndex();
            
            // Bước 2: Tìm node gần nhất trong OSM graph
            Snap snapStart = locationIndex.findClosest(latStart, lonStart, 
                edgeState -> true); // Accept all edges
            Snap snapEnd = locationIndex.findClosest(latEnd, lonEnd, 
                edgeState -> true); // Accept all edges
            
            if (!snapStart.isValid() || !snapEnd.isValid()) {
                log.error("❌ Không tìm thấy node gần vị trí");
                return createDirectRoute(latStart, lonStart, latEnd, lonEnd);
            }
            
            int startNode = snapStart.getClosestNode();
            int endNode = snapEnd.getClosestNode();
            
            log.info("📍 Start Node: {} | End Node: {}", startNode, endNode);
            
            // Bước 3: Chạy DIJKSTRA THUẦN TÚY
            DijkstraResult result = runPureDijkstra(graph, startNode, endNode);
            
            if (result == null || result.path.isEmpty()) {
                log.error("❌ Không tìm thấy đường đi");
                return createDirectRoute(latStart, lonStart, latEnd, lonEnd);
            }
            
            // Bước 4: Xây dựng DeliveryRoute
            DeliveryRoute route = buildRoute(graph, result, latStart, lonStart, latEnd, lonEnd);
            
            log.info("✅ Dijkstra: {:.2f} km, {} nodes", 
                     route.getTotalDistance(), result.path.size());
            
            return route;
            
        } catch (Exception e) {
            log.error("❌ Lỗi Dijkstra: ", e);
            return createDirectRoute(latStart, lonStart, latEnd, lonEnd);
        }
    }
    
    /**
     * THUẬT TOÁN DIJKSTRA THUẦN TÚY
     * Chạy trên graph OSM thật
     */
    private DijkstraResult runPureDijkstra(Graph graph, int startNode, int endNode) {
        log.info("🚀 Bắt đầu Dijkstra: {} → {}", startNode, endNode);
        
        // Khởi tạo
        Map<Integer, Double> distances = new HashMap<>();
        Map<Integer, Integer> previous = new HashMap<>();
        Set<Integer> visited = new HashSet<>();
        PriorityQueue<NodeDistance> queue = new PriorityQueue<>(
            Comparator.comparingDouble(nd -> nd.distance)
        );
        
        // Khởi tạo điểm bắt đầu
        distances.put(startNode, 0.0);
        queue.offer(new NodeDistance(startNode, 0.0));
        
        int iterations = 0;
        int maxIterations = 100000; // Giới hạn để tránh loop vô hạn
        
        // DIJKSTRA LOOP
        while (!queue.isEmpty() && iterations < maxIterations) {
            NodeDistance current = queue.poll();
            int currentNode = current.node;
            
            iterations++;
            
            // Đã thăm rồi
            if (visited.contains(currentNode)) {
                continue;
            }
            
            visited.add(currentNode);
            
            if (iterations % 1000 == 0) {
                log.debug("📊 Iteration {}: node {}, dist {:.2f} km", 
                         iterations, currentNode, current.distance / 1000);
            }
            
            // Tìm thấy đích!
            if (currentNode == endNode) {
                log.info("🎯 Tìm thấy đích sau {} iterations", iterations);
                return reconstructPath(startNode, endNode, previous, distances);
            }
            
            // Duyệt các cạnh kề (edges)
            var edgeIterator = graph.createEdgeExplorer().setBaseNode(currentNode);
            
            while (edgeIterator.next()) {
                int neighbor = edgeIterator.getAdjNode();
                
                if (visited.contains(neighbor)) {
                    continue;
                }
                
                // Lấy khoảng cách của cạnh (mét)
                double edgeDistance = edgeIterator.getDistance();
                double newDistance = current.distance + edgeDistance;
                double oldDistance = distances.getOrDefault(neighbor, Double.MAX_VALUE);
                
                // RELAX EDGE
                if (newDistance < oldDistance) {
                    distances.put(neighbor, newDistance);
                    previous.put(neighbor, currentNode);
                    queue.offer(new NodeDistance(neighbor, newDistance));
                }
            }
        }
        
        log.error("❌ Không tìm thấy đường sau {} iterations", iterations);
        return null;
    }
    
    /**
     * Tái tạo đường đi từ kết quả Dijkstra
     */
    private DijkstraResult reconstructPath(int startNode, int endNode,
                                          Map<Integer, Integer> previous,
                                          Map<Integer, Double> distances) {
        List<Integer> path = new ArrayList<>();
        Integer current = endNode;
        
        // Trace ngược từ đích về nguồn
        while (current != null) {
            path.add(0, current);
            current = previous.get(current);
        }
        
        // Validate
        if (path.isEmpty() || path.get(0) != startNode) {
            log.error("❌ Path không hợp lệ");
            return null;
        }
        
        double totalDistance = distances.get(endNode);
        
        DijkstraResult result = new DijkstraResult();
        result.path = path;
        result.totalDistance = totalDistance / 1000.0; // Chuyển sang km
        
        log.info("📊 Path: {} nodes, {:.2f} km", path.size(), result.totalDistance);
        
        return result;
    }
    
    /**
     * Xây dựng DeliveryRoute từ path
     */
    private DeliveryRoute buildRoute(Graph graph, DijkstraResult result,
                                     Double latStart, Double lonStart,
                                     Double latEnd, Double lonEnd) {
        DeliveryRoute route = new DeliveryRoute();
        List<double[]> coordinates = new ArrayList<>();
        
        // Thêm điểm bắt đầu thực tế
        coordinates.add(new double[]{latStart, lonStart});
        
        // Thêm tọa độ của các nodes trên đường đi
        for (int nodeId : result.path) {
            double lat = graph.getNodeAccess().getLat(nodeId);
            double lon = graph.getNodeAccess().getLon(nodeId);
            coordinates.add(new double[]{lat, lon});
        }
        
        // Thêm điểm kết thúc thực tế
        coordinates.add(new double[]{latEnd, lonEnd});
        
        route.setCoordinates(coordinates);
        route.setTotalDistance(result.totalDistance);
        route.setRouteSummary(String.format("Res Dijkstra: %.2f km qua %d nodes", 
                                           result.totalDistance, 
                                           result.path.size()));
        route.setNodes(new ArrayList<>());
        route.setSteps(new ArrayList<>());
        
        return route;
    }
    
    /**
     * Tạo route đường thẳng (fallback)
     */
    private DeliveryRoute createDirectRoute(Double latStart, Double lonStart, 
                                           Double latEnd, Double lonEnd) {
        DeliveryRoute route = new DeliveryRoute();
        
        List<double[]> coordinates = new ArrayList<>();
        coordinates.add(new double[]{latStart, lonStart});
        coordinates.add(new double[]{latEnd, lonEnd});
        
        Double distance = calculateDistance(latStart, lonStart, latEnd, lonEnd);
        
        route.setCoordinates(coordinates);
        route.setTotalDistance(distance);
        route.setRouteSummary("Đường thẳng (fallback): " + String.format("%.2f", distance) + " km");
        route.setNodes(new ArrayList<>());
        route.setSteps(new ArrayList<>());
        
        return route;
    }
    
    /**
     * Tính khoảng cách Haversine
     */
    public Double calculateDistance(Double lat1, Double lon1, Double lat2, Double lon2) {
        final int R = 6371;
        
        Double latDistance = Math.toRadians(lat2 - lat1);
        Double lonDistance = Math.toRadians(lon2 - lon1);
        
        Double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        
        Double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return R * c;
    }
    
    // ==================== Inner Classes ====================
    
    private static class NodeDistance {
        int node;
        double distance;
        
        NodeDistance(int node, double distance) {
            this.node = node;
            this.distance = distance;
        }
    }
    
    private static class DijkstraResult {
        List<Integer> path;
        double totalDistance;
    }
}