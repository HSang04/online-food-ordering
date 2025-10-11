/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.ths.onlinefood.delivery.controller;

import com.ths.onlinefood.delivery.dto.LocationUpdateRequest;
import com.ths.onlinefood.delivery.dto.TrackingResponse;
import com.ths.onlinefood.delivery.model.DeliveryLocation;
import com.ths.onlinefood.delivery.service.DeliveryTrackingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/delivery/tracking")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DeliveryTrackingController {
    
    private final DeliveryTrackingService trackingService;
    
    /**
     * Cập nhật vị trí shipper (dành cho app shipper)
     */
    @PostMapping("/update-location")
    public ResponseEntity<DeliveryLocation> updateLocation(
            @Valid @RequestBody LocationUpdateRequest request) {
        try {
            DeliveryLocation location = trackingService.updateLocation(request);
            return ResponseEntity.ok(location);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Lấy vị trí hiện tại của shipper
     */
    @GetMapping("/current/{donHangId}")
    public ResponseEntity<TrackingResponse> getCurrentLocation(@PathVariable Long donHangId) {
        try {
            TrackingResponse response = trackingService.getCurrentLocation(donHangId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Lấy lịch sử di chuyển
     */
    @GetMapping("/history/{donHangId}")
    public ResponseEntity<List<TrackingResponse>> getLocationHistory(
            @PathVariable Long donHangId,
            @RequestParam(required = false, defaultValue = "24") Integer hours) {
        try {
            List<TrackingResponse> history = trackingService.getLocationHistory(donHangId, hours);
            return ResponseEntity.ok(history);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Lấy tất cả vị trí của đơn hàng
     */
    @GetMapping("/all/{donHangId}")
    public ResponseEntity<List<DeliveryLocation>> getAllLocations(@PathVariable Long donHangId) {
        try {
            List<DeliveryLocation> locations = trackingService.getAllLocations(donHangId);
            return ResponseEntity.ok(locations);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Lấy thống kê tracking
     */
    @GetMapping("/stats/{donHangId}")
    public ResponseEntity<Map<String, Object>> getTrackingStats(@PathVariable Long donHangId) {
        try {
            Map<String, Object> stats = trackingService.getTrackingStats(donHangId);
            return ResponseEntity.ok(stats);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Xóa dữ liệu tracking cũ (admin only)
     */
    @DeleteMapping("/clean-old-data")
    public ResponseEntity<Map<String, String>> cleanOldData(
            @RequestParam(required = false, defaultValue = "30") Integer daysToKeep) {
        try {
            trackingService.cleanOldTrackingData(daysToKeep);
            return ResponseEntity.ok(Map.of(
                "message", "Đã xóa dữ liệu tracking cũ hơn " + daysToKeep + " ngày",
                "status", "success"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "message", "Lỗi khi xóa dữ liệu: " + e.getMessage(),
                "status", "error"
            ));
        }
    }
}