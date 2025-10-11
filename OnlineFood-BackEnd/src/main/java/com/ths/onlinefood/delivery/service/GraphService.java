/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.ths.onlinefood.delivery.service;

import com.ths.onlinefood.delivery.model.GraphEdge;
import com.ths.onlinefood.delivery.model.GraphNode;
import com.ths.onlinefood.delivery.model.NodeType;
import com.ths.onlinefood.delivery.model.RoadType;
import com.ths.onlinefood.delivery.repository.GraphEdgeRepository;
import com.ths.onlinefood.delivery.repository.GraphNodeRepository;
import java.util.ArrayList;
import java.util.HashMap;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class GraphService {
    
    private final GraphNodeRepository nodeRepository;
    private final GraphEdgeRepository edgeRepository;
    private final DijkstraService dijkstraService;
    
    /**
     * Tạo nút mới
     */
    @Transactional
    public GraphNode createNode(String nodeName, Double lat, Double lon, 
                                NodeType nodeType, String address) {
        GraphNode node = new GraphNode();
        node.setNodeName(nodeName);
        node.setLatitude(lat);
        node.setLongitude(lon);
        node.setNodeType(nodeType);
        node.setAddress(address);
        node.setIsActive(true);
        
        GraphNode saved = nodeRepository.save(node);
        log.info("Đã tạo nút mới: {} tại ({}, {})", nodeName, lat, lon);
        return saved;
    }
    
    /**
     * Cập nhật nút
     */
    @Transactional
    public GraphNode updateNode(Long nodeId, String nodeName, Double lat, Double lon, 
                               NodeType nodeType, String address) {
        GraphNode node = nodeRepository.findById(nodeId)
            .orElseThrow(() -> new IllegalArgumentException("Nút không tồn tại"));
        
        if (nodeName != null) node.setNodeName(nodeName);
        if (lat != null) node.setLatitude(lat);
        if (lon != null) node.setLongitude(lon);
        if (nodeType != null) node.setNodeType(nodeType);
        if (address != null) node.setAddress(address);
        
        return nodeRepository.save(node);
    }
    
    /**
     * Xóa nút (soft delete)
     */
    @Transactional
    public void deleteNode(Long nodeId) {
        GraphNode node = nodeRepository.findById(nodeId)
            .orElseThrow(() -> new IllegalArgumentException("Nút không tồn tại"));
        
        node.setIsActive(false);
        nodeRepository.save(node);
        
        // Vô hiệu hóa tất cả các cạnh liên quan
        List<GraphEdge> edges = edgeRepository.findByStartNodeAndIsActiveTrue(node);
        edges.addAll(edgeRepository.findByEndNodeAndIsActiveTrue(node));
        
        edges.forEach(edge -> {
            edge.setIsActive(false);
            edgeRepository.save(edge);
        });
        
        log.info("Đã xóa nút: {}", nodeId);
    }
    
    /**
     * Tạo cạnh giữa 2 nút
     */
    @Transactional
    public GraphEdge createEdge(Long startNodeId, Long endNodeId, 
                               RoadType roadType, String roadName, 
                               Boolean isTwoWay, Integer trafficLevel) {
        GraphNode startNode = nodeRepository.findById(startNodeId)
            .orElseThrow(() -> new IllegalArgumentException("Nút bắt đầu không tồn tại"));
        
        GraphNode endNode = nodeRepository.findById(endNodeId)
            .orElseThrow(() -> new IllegalArgumentException("Nút kết thúc không tồn tại"));
        
        // Tính khoảng cách tự động
        Double distance = dijkstraService.calculateDistance(
            startNode.getLatitude(), startNode.getLongitude(),
            endNode.getLatitude(), endNode.getLongitude()
        );
        
        // Tính thời gian dự kiến (dựa trên loại đường)
        Double speed = switch (roadType) {
            case HIGHWAY -> 60.0;        // 60 km/h
            case MAIN_ROAD -> 40.0;      // 40 km/h
            case SECONDARY_ROAD -> 30.0; // 30 km/h
            case ALLEY -> 15.0;          // 15 km/h
            case RESIDENTIAL -> 25.0;    // 25 km/h
        };
        
        Double duration = (distance / speed) * 60.0; // phút
        
        GraphEdge edge = new GraphEdge();
        edge.setStartNode(startNode);
        edge.setEndNode(endNode);
        edge.setDistance(distance);
        edge.setDuration(duration);
        edge.setRoadType(roadType);
        edge.setRoadName(roadName);
        edge.setIsTwoWay(isTwoWay != null ? isTwoWay : true);
        edge.setTrafficLevel(trafficLevel != null ? trafficLevel : 1);
        edge.setIsActive(true);
        
        GraphEdge saved = edgeRepository.save(edge);
        log.info("Đã tạo cạnh từ {} đến {}: {:.2f} km", 
                 startNode.getNodeName(), endNode.getNodeName(), distance);
        
        return saved;
    }
    
    /**
     * Cập nhật cạnh
     */
    @Transactional
    public GraphEdge updateEdge(Long edgeId, RoadType roadType, String roadName, 
                               Boolean isTwoWay, Integer trafficLevel) {
        GraphEdge edge = edgeRepository.findById(edgeId)
            .orElseThrow(() -> new IllegalArgumentException("Cạnh không tồn tại"));
        
        if (roadType != null) {
            edge.setRoadType(roadType);
            
            // Cập nhật lại thời gian khi đổi loại đường
            Double speed = switch (roadType) {
                case HIGHWAY -> 60.0;
                case MAIN_ROAD -> 40.0;
                case SECONDARY_ROAD -> 30.0;
                case ALLEY -> 15.0;
                case RESIDENTIAL -> 25.0;
            };
            
            Double duration = (edge.getDistance() / speed) * 60.0;
            edge.setDuration(duration);
        }
        
        if (roadName != null) edge.setRoadName(roadName);
        if (isTwoWay != null) edge.setIsTwoWay(isTwoWay);
        if (trafficLevel != null) edge.setTrafficLevel(trafficLevel);
        
        return edgeRepository.save(edge);
    }
    
    /**
     * Xóa cạnh (soft delete)
     */
    @Transactional
    public void deleteEdge(Long edgeId) {
        GraphEdge edge = edgeRepository.findById(edgeId)
            .orElseThrow(() -> new IllegalArgumentException("Cạnh không tồn tại"));
        
        edge.setIsActive(false);
        edgeRepository.save(edge);
        log.info("Đã xóa cạnh: {}", edgeId);
    }
    
    /**
     * Lấy tất cả nút
     */
    public List<GraphNode> getAllNodes() {
        return nodeRepository.findByIsActiveTrue();
    }
    
    /**
     * Lấy tất cả cạnh
     */
    public List<GraphEdge> getAllEdges() {
        return edgeRepository.findByIsActiveTrue();
    }
    
    /**
     * Lấy nút theo ID
     */
    public Optional<GraphNode> getNodeById(Long nodeId) {
        return nodeRepository.findById(nodeId);
    }
    
    /**
     * Lấy cạnh theo ID
     */
    public Optional<GraphEdge> getEdgeById(Long edgeId) {
        return edgeRepository.findById(edgeId);
    }
    
    /**
     * Tìm nút gần vị trí
     */
    public List<GraphNode> findNearbyNodes(Double lat, Double lon, Double radius) {
        return nodeRepository.findNearbyNodes(lat, lon, radius);
    }
    
    /**
     * Lấy nút cửa hàng
     */
    public Optional<GraphNode> getStoreNode() {
        return nodeRepository.findStoreNode();
    }
    
    /**
     * Khởi tạo đồ thị mẫu cho TP.HCM
     */
    @Transactional
    public void initializeSampleGraph() {
        log.info("Bắt đầu khởi tạo đồ thị mẫu cho TP.HCM");
        
        // Tạo nút cửa hàng (giả sử ở Quận 1)
        GraphNode store = createNode("Cửa hàng Online Food", 
                                     10.7769, 106.7009, 
                                     NodeType.STORE, 
                                     "123 Nguyễn Huệ, Quận 1, TP.HCM");
        
        // Tạo các nút giao lộ chính
        GraphNode node1 = createNode("Ngã tư Bến Thành", 
                                     10.7726, 106.6980, 
                                     NodeType.INTERSECTION, 
                                     "Ngã tư Lê Lợi - Pasteur");
        
        GraphNode node2 = createNode("Ngã tư Trần Hưng Đạo - Nguyễn Trãi", 
                                     10.7640, 106.6813, 
                                     NodeType.INTERSECTION, 
                                     "Quận 1");
        
        GraphNode node3 = createNode("Ngã ba Cách Mạng Tháng Tám", 
                                     10.7827, 106.6797, 
                                     NodeType.INTERSECTION, 
                                     "Quận 3");
        
        GraphNode node4 = createNode("Ngã tư Hoàng Văn Thụ", 
                                     10.8008, 106.6894, 
                                     NodeType.INTERSECTION, 
                                     "Quận Phú Nhuận");
        
        GraphNode node5 = createNode("Chợ Bến Thành", 
                                     10.7728, 106.6980, 
                                     NodeType.LANDMARK, 
                                     "Chợ Bến Thành, Quận 1");
        
        GraphNode node6 = createNode("Nhà Thờ Đức Bà", 
                                     10.7797, 106.6990, 
                                     NodeType.LANDMARK, 
                                     "Công xã Paris, Quận 1");
        
        GraphNode node7 = createNode("Bưu điện Thành phố", 
                                     10.7798, 106.6999, 
                                     NodeType.LANDMARK, 
                                     "Công xã Paris, Quận 1");
        
        GraphNode node8 = createNode("Dinh Độc Lập", 
                                     10.7769, 106.6956, 
                                     NodeType.LANDMARK, 
                                     "135 Nam Kỳ Khởi Nghĩa, Quận 1");
        
        GraphNode node9 = createNode("Ngã tư Phú Nhuận", 
                                     10.7991, 106.6781, 
                                     NodeType.INTERSECTION, 
                                     "Phan Đăng Lưu, Phú Nhuận");
        
        GraphNode node10 = createNode("Khu dân cư Bình Thạnh", 
                                      10.8142, 106.7100, 
                                      NodeType.RESIDENTIAL, 
                                      "Quận Bình Thạnh");
        
        // Tạo các cạnh (đường đi)
        createEdge(store.getId(), node6.getId(), 
                  RoadType.MAIN_ROAD, "Đường Nguyễn Huệ", true, 2);
        
        createEdge(node6.getId(), node7.getId(), 
                  RoadType.MAIN_ROAD, "Đường Công xã Paris", true, 1);
        
        createEdge(node7.getId(), node1.getId(), 
                  RoadType.MAIN_ROAD, "Đường Đồng Khởi", true, 2);
        
        createEdge(node1.getId(), node5.getId(), 
                  RoadType.MAIN_ROAD, "Đường Lê Lợi", true, 3);
        
        createEdge(node5.getId(), node2.getId(), 
                  RoadType.MAIN_ROAD, "Đường Trần Hưng Đạo", true, 2);
        
        createEdge(node2.getId(), node3.getId(), 
                  RoadType.MAIN_ROAD, "Đường Nguyễn Trãi", true, 3);
        
        createEdge(node3.getId(), node4.getId(), 
                  RoadType.MAIN_ROAD, "Đường Cách Mạng Tháng Tám", true, 2);
        
        createEdge(node4.getId(), node9.getId(), 
                  RoadType.SECONDARY_ROAD, "Đường Phan Đăng Lưu", true, 2);
        
        createEdge(store.getId(), node8.getId(), 
                  RoadType.MAIN_ROAD, "Đường Nam Kỳ Khởi Nghĩa", true, 2);
        
        createEdge(node8.getId(), node3.getId(), 
                  RoadType.MAIN_ROAD, "Đường Điện Biên Phủ", true, 3);
        
        createEdge(node6.getId(), node10.getId(), 
                  RoadType.SECONDARY_ROAD, "Đường Đinh Tiên Hoàng", true, 2);
        
        createEdge(node10.getId(), node4.getId(), 
                  RoadType.RESIDENTIAL, "Đường Bạch Đằng", true, 1);
        
        // Thêm một số đường hẻm
        createEdge(node1.getId(), node3.getId(), 
                  RoadType.ALLEY, "Hẻm 123 Lê Lợi", true, 1);
        
        createEdge(node5.getId(), node6.getId(), 
                  RoadType.ALLEY, "Hẻm Pasteur", true, 1);
        
        log.info("Đã khởi tạo đồ thị mẫu: {} nút, {} cạnh", 
                 nodeRepository.count(), edgeRepository.count());
    }
    
    /**
     * Thống kê đồ thị
     */
    public Map<String, Object> getGraphStatistics() {
        Map<String, Object> stats = new HashMap<>();
        
        long totalNodes = nodeRepository.count();
        long activeNodes = nodeRepository.findByIsActiveTrue().size();
        long totalEdges = edgeRepository.count();
        long activeEdges = edgeRepository.findByIsActiveTrue().size();
        
        stats.put("totalNodes", totalNodes);
        stats.put("activeNodes", activeNodes);
        stats.put("totalEdges", totalEdges);
        stats.put("activeEdges", activeEdges);
        
        // Thống kê theo loại nút
        Map<String, Long> nodesByType = new HashMap<>();
        for (NodeType type : NodeType.values()) {
            long count = nodeRepository.findByNodeTypeAndIsActiveTrue(type).size();
            nodesByType.put(type.name(), count);
        }
        stats.put("nodesByType", nodesByType);
        
        // Thống kê theo loại đường
        Map<String, Long> edgesByType = new HashMap<>();
        for (RoadType type : RoadType.values()) {
            long count = edgeRepository.findByRoadTypeAndIsActiveTrue(type).size();
            edgesByType.put(type.name(), count);
        }
        stats.put("edgesByType", edgesByType);
        
        // Tổng khoảng cách
        Double totalDistance = edgeRepository.calculateTotalDistance();
        stats.put("totalDistance", String.format("%.2f km", totalDistance != null ? totalDistance : 0.0));
        
        return stats;
    }
    
    /**
     * Validate đồ thị
     */
    public List<String> validateGraph() {
        List<String> issues = new ArrayList<>();
        
        // Kiểm tra nút không có cạnh nào
        List<GraphNode> nodes = nodeRepository.findByIsActiveTrue();
        for (GraphNode node : nodes) {
            Long edgeCount = edgeRepository.countEdgesByNode(node);
            if (edgeCount == 0) {
                issues.add(String.format("Nút '%s' (ID: %d) không có cạnh nào", 
                                        node.getNodeName(), node.getId()));
            }
        }
        
        // Kiểm tra cạnh có khoảng cách = 0 hoặc âm
        List<GraphEdge> edges = edgeRepository.findByIsActiveTrue();
        for (GraphEdge edge : edges) {
            if (edge.getDistance() <= 0) {
                issues.add(String.format("Cạnh %d có khoảng cách không hợp lệ: %.2f km", 
                                        edge.getId(), edge.getDistance()));
            }
        }
        
        // Kiểm tra nút cửa hàng
        Optional<GraphNode> storeNode = nodeRepository.findStoreNode();
        if (storeNode.isEmpty()) {
            issues.add("Không tìm thấy nút cửa hàng trong đồ thị");
        }
        
        if (issues.isEmpty()) {
            issues.add("Đồ thị hợp lệ, không có lỗi");
        }
        
        return issues;
    }
}