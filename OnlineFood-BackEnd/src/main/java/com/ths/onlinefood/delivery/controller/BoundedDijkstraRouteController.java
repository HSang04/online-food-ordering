package com.ths.onlinefood.delivery.controller;

import com.ths.onlinefood.delivery.dto.RouteResponse;
import com.ths.onlinefood.delivery.model.DeliveryRoute;
import com.ths.onlinefood.delivery.service.BoundedDijkstraService;
import com.ths.onlinefood.model.ThongTinCuaHang;
import com.ths.onlinefood.service.GeoLocationService;
import com.ths.onlinefood.service.ThongTinCuaHangService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/delivery/route/bounded-dijkstra")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BoundedDijkstraRouteController {

    private final BoundedDijkstraService boundedDijkstraService;
    private final ThongTinCuaHangService cuaHangService;
    private final GeoLocationService     geoLocationService;

    @GetMapping("/shortest-path")
    public ResponseEntity<RouteResponse> getShortestPath(
            @RequestParam Double latStart,
            @RequestParam Double lonStart,
            @RequestParam Double latEnd,
            @RequestParam Double lonEnd,
            @RequestParam(defaultValue = "10000") Double boundMeters
    ) {
        RouteResponse response = new RouteResponse();
        try {
            DeliveryRoute route = boundedDijkstraService.findRoute(
                    latStart, lonStart, latEnd, lonEnd, boundMeters
            );

            boolean success = route.getCoordinates() != null && !route.getCoordinates().isEmpty();
            response.setSuccess(success);
            response.setMessage(route.getRouteSummary());
            response.setRoutePath(route.getCoordinates());
            response.setTotalDistance(route.getTotalDistance());
            response.setEstimatedDuration(route.getEstimatedDuration());
            response.setRouteSummary(route.getRouteSummary());
            response.setSteps(route.getSteps());
            response.setNodeCount(
                    route.getCoordinates() == null ? 0 : route.getCoordinates().size()
            );

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            response.setSuccess(false);
            response.setMessage("Bounded Dijkstra exception: " + e.getClass().getSimpleName());
            return ResponseEntity.ok(response);
        }
    }

    @GetMapping("/shortest-path-by-address")
    public ResponseEntity<RouteResponse> getShortestPathByAddress(
            @RequestParam String deliveryAddress,
            @RequestParam(defaultValue = "10000") Double boundMeters
    ) {
        RouteResponse response = new RouteResponse();
        try {
            ThongTinCuaHang cuaHang = cuaHangService.getCuaHang()
                    .orElseThrow(() -> new RuntimeException("Chưa có thông tin cửa hàng"));

            if (cuaHang.getViDo() == null || cuaHang.getKinhDo() == null) {
                throw new RuntimeException("Cửa hàng chưa có tọa độ");
            }

            double[] deliveryCoords = geoLocationService.getLatLngFromAddress(deliveryAddress);

            DeliveryRoute route = boundedDijkstraService.findRoute(
                    cuaHang.getViDo(),
                    cuaHang.getKinhDo(),
                    deliveryCoords[0],
                    deliveryCoords[1],
                    boundMeters
            );

            boolean success = route.getCoordinates() != null && !route.getCoordinates().isEmpty();
            response.setSuccess(success);
            response.setMessage(route.getRouteSummary());
            response.setRoutePath(route.getCoordinates());
            response.setTotalDistance(route.getTotalDistance());
            response.setEstimatedDuration(route.getEstimatedDuration());
            response.setRouteSummary(route.getRouteSummary());
            response.setSteps(route.getSteps());
            response.setNodeCount(
                    route.getCoordinates() == null ? 0 : route.getCoordinates().size()
            );

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            response.setSuccess(false);
            response.setMessage("Lỗi: " + e.getMessage());
            return ResponseEntity.ok(response);
        }
    }
}