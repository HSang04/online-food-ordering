package com.ths.onlinefood.delivery.controller;

import com.ths.onlinefood.delivery.dto.RouteResponse;
import com.ths.onlinefood.delivery.model.*;
import com.ths.onlinefood.delivery.service.DijkstraService;
import com.ths.onlinefood.delivery.service.GraphService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/delivery/route")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class RouteController {
    
    private final DijkstraService dijkstraService;
    private final GraphService graphService;
    
    /**
     * Tính đường đi ngắn nhất từ A đến B
     */
    @GetMapping("/shortest-path")
    public ResponseEntity<RouteResponse> getShortestPath(
            @RequestParam Double latStart,
            @RequestParam Double lonStart,
            @RequestParam Double latEnd,
            @RequestParam Double lonEnd) {
        try {
            DeliveryRoute route = dijkstraService.findShortestPath(
                latStart, lonStart, latEnd, lonEnd
            );
            
            RouteResponse response = new RouteResponse();
            response.setSuccess(true);
            response.setMessage("Tìm thấy đường đi");
            response.setRoutePath(route.getCoordinates());
            response.setTotalDistance(route.getTotalDistance());
            response.setRouteSummary(route.getRouteSummary());
            response.setSteps(route.getSteps());
            response.setNodeCount(route.getCoordinates().size());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            RouteResponse response = new RouteResponse();
            response.setSuccess(false);
            response.setMessage("Lỗi: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * Tính đường đi từ cửa hàng đến khách hàng
     */
    @GetMapping("/store-to-customer")
    public ResponseEntity<RouteResponse> getStoreToCustomerRoute(
            @RequestParam Double customerLat,
            @RequestParam Double customerLon) {
        try {
            var storeNode = graphService.getStoreNode()
                .orElseThrow(() -> new IllegalStateException("Không tìm thấy cửa hàng"));
            
            DeliveryRoute route = dijkstraService.findShortestPath(
                storeNode.getLatitude(), storeNode.getLongitude(),
                customerLat, customerLon
            );
            
            RouteResponse response = new RouteResponse();
            response.setSuccess(true);
            response.setMessage("Tìm thấy đường đi từ cửa hàng");
            response.setRoutePath(route.getCoordinates());
            response.setTotalDistance(route.getTotalDistance());
            response.setRouteSummary(route.getRouteSummary());
            response.setSteps(route.getSteps());
            response.setNodeCount(route.getCoordinates().size());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            RouteResponse response = new RouteResponse();
            response.setSuccess(false);
            response.setMessage("Lỗi: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    

    @GetMapping("/test")
    public ResponseEntity<String> testGraphHopper() {
        try {
            DeliveryRoute route = dijkstraService.findShortestPath(
                10.7726, 106.6980,
                10.7797, 106.6990
            );
            
            return ResponseEntity.ok(
                String.format("✅ GraphHopper OK!\nKhoảng cách: %.2f km\nĐiểm: %d", 
                             route.getTotalDistance(), 
                             route.getCoordinates().size())
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("❌ Lỗi: " + e.getMessage());
        }
    }
}