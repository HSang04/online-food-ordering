package com.ths.onlinefood.delivery.controller;

import com.ths.onlinefood.delivery.dto.RouteResponse;
import com.ths.onlinefood.delivery.model.DeliveryRoute;
import com.ths.onlinefood.delivery.service.DijkstraService;
import com.ths.onlinefood.model.ThongTinCuaHang;
import com.ths.onlinefood.service.GeoLocationService;
import com.ths.onlinefood.service.ThongTinCuaHangService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/delivery/route/dijkstra")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DijkstraRouteController {

    private final DijkstraService dijkstraService;
    private final ThongTinCuaHangService cuaHangService;
    private final GeoLocationService geoLocationService;

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

    @GetMapping("/shortest-path-by-address")
    public ResponseEntity<RouteResponse> getShortestPathByAddress(
            @RequestParam String deliveryAddress) {
        RouteResponse response = new RouteResponse();
        try {
            // Lấy tọa độ cửa hàng
            ThongTinCuaHang cuaHang = cuaHangService.getCuaHang()
                    .orElseThrow(() -> new RuntimeException("Chưa có thông tin cửa hàng"));

            if (cuaHang.getViDo() == null || cuaHang.getKinhDo() == null) {
                throw new RuntimeException("Cửa hàng chưa có tọa độ");
            }

            // Chuyển địa chỉ giao hàng thành tọa độ
            double[] deliveryCoords = geoLocationService.getLatLngFromAddress(deliveryAddress);

            // Tìm đường đi
            DeliveryRoute route = dijkstraService.findShortestPath(
                    cuaHang.getViDo(),
                    cuaHang.getKinhDo(),
                    deliveryCoords[0],
                    deliveryCoords[1]
            );

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
            response.setSuccess(false);
            response.setMessage("Lỗi: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/test")
    public ResponseEntity<String> testDijkstra() {
        try {
            DeliveryRoute route = dijkstraService.findShortestPath(
                    10.7769, 106.7009,
                    10.7863, 106.6839
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