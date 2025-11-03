package com.ths.onlinefood.delivery.controller;

import com.ths.onlinefood.delivery.dto.RouteResponse;
import com.ths.onlinefood.delivery.model.DeliveryRoute;
import com.ths.onlinefood.delivery.service.DijkstraService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/delivery/route")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class RouteController {
    
    private final DijkstraService dijkstraService;
    
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
            response.setEstimatedDuration(route.getEstimatedDuration());
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
     * Test endpoint
     */
    @GetMapping("/test")
    public ResponseEntity<String> testDijkstra() {
        try {
            // Test 2 điểm ở TP.HCM
            DeliveryRoute route = dijkstraService.findShortestPath(
                10.7769, 106.7009,  // Quận 1
                10.7863, 106.6839   // Quận 3
            );
            
            return ResponseEntity.ok(
                String.format("✅ Dijkstra OK!\n" +
                             "Khoảng cách: %.2f km\n" +
                             "Thời gian: %.0f phút\n" +
                             "Điểm: %d\n" +
                             "Mô tả: %s", 
                             route.getTotalDistance(),
                             route.getEstimatedDuration(),
                             route.getCoordinates().size(),
                             route.getRouteSummary())
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("❌ Lỗi: " + e.getMessage());
        }
    }
}