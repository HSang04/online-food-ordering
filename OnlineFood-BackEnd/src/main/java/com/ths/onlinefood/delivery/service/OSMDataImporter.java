/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.ths.onlinefood.delivery.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import com.ths.onlinefood.delivery.repository.GraphNodeRepository;
import com.ths.onlinefood.delivery.repository.GraphEdgeRepository;
import com.ths.onlinefood.delivery.model.GraphNode;
import com.ths.onlinefood.delivery.model.GraphEdge;
import com.ths.onlinefood.delivery.model.NodeType;
import com.ths.onlinefood.delivery.model.RoadType;

// ===== THÊM CÁC IMPORT NÀY =====
import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.ArrayList;
// ================================

@Slf4j
@Service
@RequiredArgsConstructor
public class OSMDataImporter {
    
    private final GraphNodeRepository nodeRepository;
    private final GraphEdgeRepository edgeRepository;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    /**
     * Import dữ liệu đường thực tế từ OpenStreetMap
     * Sử dụng Overpass API - hoàn toàn miễn phí
     */
    public void importRealRoadsFromOSM(double minLat, double minLon, 
                                       double maxLat, double maxLon) {
        log.info("Bắt đầu import dữ liệu OSM cho khu vực: ({},{}) đến ({},{})", 
                 minLat, minLon, maxLat, maxLon);
        
        try {
            // Overpass Query - lấy tất cả đường trong khu vực
            String overpassQuery = buildOverpassQuery(minLat, minLon, maxLat, maxLon);
            
            // Gọi Overpass API
            String url = "https://overpass-api.de/api/interpreter";
            String response = restTemplate.postForObject(url, overpassQuery, String.class);
            
            // Parse và lưu vào database
            parseAndSaveOSMData(response);
            
            log.info("Hoàn tất import dữ liệu OSM");
            
        } catch (Exception e) {
            log.error("Lỗi import dữ liệu OSM: ", e);
        }
    }
    
    /**
     * Xây dựng query cho Overpass API
     */
    private String buildOverpassQuery(double minLat, double minLon, 
                                     double maxLat, double maxLon) {
        // Query lấy các đường chính, phụ, hẻm trong TP.HCM
        return String.format("""
            [out:json][timeout:60];
            (
              way["highway"~"motorway|trunk|primary|secondary|tertiary|residential"]
                  (%f,%f,%f,%f);
            );
            out body;
            >;
            out skel qt;
            """, minLat, minLon, maxLat, maxLon);
    }
    
    /**
     * Parse dữ liệu OSM và lưu vào database
     */
    private void parseAndSaveOSMData(String jsonData) throws Exception {
        JsonNode root = objectMapper.readTree(jsonData);
        JsonNode elements = root.get("elements");
        
        Map<Long, GraphNode> osmNodeMap = new HashMap<>();
        // Xóa dòng này vì không dùng: List<OSMWay> osmWays = new ArrayList<>();
        
        // Bước 1: Lưu tất cả các node (điểm)
        for (JsonNode element : elements) {
            String type = element.get("type").asText();
            
            if ("node".equals(type)) {
                long osmId = element.get("id").asLong();
                double lat = element.get("lat").asDouble();
                double lon = element.get("lon").asDouble();
                
                GraphNode node = new GraphNode();
                node.setNodeName("OSM Node " + osmId);
                node.setLatitude(lat);
                node.setLongitude(lon);
                node.setNodeType(NodeType.INTERSECTION);
                node.setIsActive(true);
                
                GraphNode savedNode = nodeRepository.save(node);
                osmNodeMap.put(osmId, savedNode);
            }
        }
        
        log.info("Đã lưu {} nodes", osmNodeMap.size());
        
        // Bước 2: Lưu tất cả các way (đường)
        for (JsonNode element : elements) {
            String type = element.get("type").asText();
            
            if ("way".equals(type)) {
                JsonNode tags = element.get("tags");
                if (tags == null) continue;
                
                String highway = tags.has("highway") ? tags.get("highway").asText() : null;
                String name = tags.has("name") ? tags.get("name").asText() : "Đường không tên";
                boolean oneway = tags.has("oneway") && "yes".equals(tags.get("oneway").asText());
                
                JsonNode nodes = element.get("nodes");
                if (nodes == null || nodes.size() < 2) continue;
                
                // Tạo edges giữa các node liên tiếp
                for (int i = 0; i < nodes.size() - 1; i++) {
                    long startOsmId = nodes.get(i).asLong();
                    long endOsmId = nodes.get(i + 1).asLong();
                    
                    GraphNode startNode = osmNodeMap.get(startOsmId);
                    GraphNode endNode = osmNodeMap.get(endOsmId);
                    
                    if (startNode != null && endNode != null) {
                        createEdge(startNode, endNode, name, highway, !oneway);
                    }
                }
            }
        }
        
        log.info("Đã tạo edges từ OSM ways");
    }
    
    /**
     * Tạo edge giữa 2 node
     */
    private void createEdge(GraphNode start, GraphNode end, 
                          String roadName, String osmHighway, boolean isTwoWay) {
        
        // Tính khoảng cách
        double distance = calculateDistance(
            start.getLatitude(), start.getLongitude(),
            end.getLatitude(), end.getLongitude()
        );
        
        // Map OSM highway type sang RoadType của chúng ta
        RoadType roadType = mapOSMHighwayToRoadType(osmHighway);
        
        // Tính thời gian dựa trên loại đường
        double speed = getSpeedByRoadType(roadType);
        double duration = (distance / speed) * 60.0; // phút
        
        GraphEdge edge = new GraphEdge();
        edge.setStartNode(start);
        edge.setEndNode(end);
        edge.setDistance(distance);
        edge.setDuration(duration);
        edge.setRoadType(roadType);
        edge.setRoadName(roadName);
        edge.setIsTwoWay(isTwoWay);
        edge.setIsActive(true);
        edge.setTrafficLevel(1);
        
        edgeRepository.save(edge);
    }
    
    /**
     * Map từ OSM highway type sang RoadType
     */
    private RoadType mapOSMHighwayToRoadType(String osmHighway) {
        return switch (osmHighway) {
            case "motorway", "trunk" -> RoadType.HIGHWAY;
            case "primary", "primary_link" -> RoadType.MAIN_ROAD;
            case "secondary", "secondary_link" -> RoadType.SECONDARY_ROAD;
            case "tertiary", "tertiary_link" -> RoadType.RESIDENTIAL;
            case "residential", "living_street" -> RoadType.ALLEY;
            default -> RoadType.RESIDENTIAL;
        };
    }
    
    /**
     * Lấy tốc độ theo loại đường
     */
    private double getSpeedByRoadType(RoadType roadType) {
        return switch (roadType) {
            case HIGHWAY -> 60.0;
            case MAIN_ROAD -> 40.0;
            case SECONDARY_ROAD -> 30.0;
            case ALLEY -> 15.0;
            case RESIDENTIAL -> 25.0;
        };
    }
    
    /**
     * Haversine formula
     */
    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // km
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}