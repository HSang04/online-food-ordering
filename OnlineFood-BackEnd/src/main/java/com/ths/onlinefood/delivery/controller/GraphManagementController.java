/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.ths.onlinefood.delivery.controller;



import com.ths.onlinefood.delivery.model.*;
import com.ths.onlinefood.delivery.service.GraphService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/delivery/graph")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class GraphManagementController {
    
    private final GraphService graphService;
    
    // ==================== Node Management ====================
    
    /**
     * Lấy tất cả nút
     */
    @GetMapping("/nodes")
    public ResponseEntity<List<GraphNode>> getAllNodes() {
        return ResponseEntity.ok(graphService.getAllNodes());
    }
    
    /**
     * Lấy nút theo ID
     */
    @GetMapping("/nodes/{id}")
    public ResponseEntity<GraphNode> getNodeById(@PathVariable Long id) {
        return graphService.getNodeById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Tạo nút mới
     */
    @PostMapping("/nodes")
    public ResponseEntity<GraphNode> createNode(@RequestBody NodeCreateRequest request) {
        try {
            GraphNode node = graphService.createNode(
                request.getNodeName(),
                request.getLatitude(),
                request.getLongitude(),
                request.getNodeType(),
                request.getAddress()
            );
            return ResponseEntity.ok(node);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Cập nhật nút
     */
    @PutMapping("/nodes/{id}")
    public ResponseEntity<GraphNode> updateNode(
            @PathVariable Long id,
            @RequestBody NodeCreateRequest request) {
        try {
            GraphNode node = graphService.updateNode(
                id,
                request.getNodeName(),
                request.getLatitude(),
                request.getLongitude(),
                request.getNodeType(),
                request.getAddress()
            );
            return ResponseEntity.ok(node);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Xóa nút
     */
    @DeleteMapping("/nodes/{id}")
    public ResponseEntity<Map<String, String>> deleteNode(@PathVariable Long id) {
        try {
            graphService.deleteNode(id);
            return ResponseEntity.ok(Map.of(
                "message", "Đã xóa nút thành công",
                "status", "success"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "message", "Lỗi: " + e.getMessage(),
                "status", "error"
            ));
        }
    }
    
    /**
     * Tìm nút gần vị trí
     */
    @GetMapping("/nodes/nearby")
    public ResponseEntity<List<GraphNode>> findNearbyNodes(
            @RequestParam Double lat,
            @RequestParam Double lon,
            @RequestParam(defaultValue = "5.0") Double radius) {
        try {
            List<GraphNode> nodes = graphService.findNearbyNodes(lat, lon, radius);
            return ResponseEntity.ok(nodes);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Lấy nút cửa hàng
     */
    @GetMapping("/nodes/store")
    public ResponseEntity<GraphNode> getStoreNode() {
        return graphService.getStoreNode()
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    // ==================== Edge Management ====================
    
    /**
     * Lấy tất cả cạnh
     */
    @GetMapping("/edges")
    public ResponseEntity<List<GraphEdge>> getAllEdges() {
        return ResponseEntity.ok(graphService.getAllEdges());
    }
    
    /**
     * Lấy cạnh theo ID
     */
    @GetMapping("/edges/{id}")
    public ResponseEntity<GraphEdge> getEdgeById(@PathVariable Long id) {
        return graphService.getEdgeById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Tạo cạnh mới
     */
    @PostMapping("/edges")
    public ResponseEntity<GraphEdge> createEdge(@RequestBody EdgeCreateRequest request) {
        try {
            GraphEdge edge = graphService.createEdge(
                request.getStartNodeId(),
                request.getEndNodeId(),
                request.getRoadType(),
                request.getRoadName(),
                request.getIsTwoWay(),
                request.getTrafficLevel()
            );
            return ResponseEntity.ok(edge);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Cập nhật cạnh
     */
    @PutMapping("/edges/{id}")
    public ResponseEntity<GraphEdge> updateEdge(
            @PathVariable Long id,
            @RequestBody EdgeUpdateRequest request) {
        try {
            GraphEdge edge = graphService.updateEdge(
                id,
                request.getRoadType(),
                request.getRoadName(),
                request.getIsTwoWay(),
                request.getTrafficLevel()
            );
            return ResponseEntity.ok(edge);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Xóa cạnh
     */
    @DeleteMapping("/edges/{id}")
    public ResponseEntity<Map<String, String>> deleteEdge(@PathVariable Long id) {
        try {
            graphService.deleteEdge(id);
            return ResponseEntity.ok(Map.of(
                "message", "Đã xóa cạnh thành công",
                "status", "success"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "message", "Lỗi: " + e.getMessage(),
                "status", "error"
            ));
        }
    }
    
    // ==================== Graph Operations ====================
    
    /**
     * Khởi tạo đồ thị mẫu
     */
    @PostMapping("/initialize-sample")
    public ResponseEntity<Map<String, String>> initializeSampleGraph() {
        try {
            graphService.initializeSampleGraph();
            return ResponseEntity.ok(Map.of(
                "message", "Đã khởi tạo đồ thị mẫu thành công",
                "status", "success"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "message", "Lỗi: " + e.getMessage(),
                "status", "error"
            ));
        }
    }
    
    /**
     * Lấy thống kê đồ thị
     */
    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getGraphStatistics() {
        return ResponseEntity.ok(graphService.getGraphStatistics());
    }
    
    /**
     * Validate đồ thị
     */
    @GetMapping("/validate")
    public ResponseEntity<List<String>> validateGraph() {
        return ResponseEntity.ok(graphService.validateGraph());
    }
    
    // ==================== Request DTOs ====================
    
    @lombok.Data
    public static class NodeCreateRequest {
        private String nodeName;
        private Double latitude;
        private Double longitude;
        private NodeType nodeType;
        private String address;
    }
    
    @lombok.Data
    public static class EdgeCreateRequest {
        private Long startNodeId;
        private Long endNodeId;
        private RoadType roadType;
        private String roadName;
        private Boolean isTwoWay;
        private Integer trafficLevel;
    }
    
    @lombok.Data
    public static class EdgeUpdateRequest {
        private RoadType roadType;
        private String roadName;
        private Boolean isTwoWay;
        private Integer trafficLevel;
    }
}