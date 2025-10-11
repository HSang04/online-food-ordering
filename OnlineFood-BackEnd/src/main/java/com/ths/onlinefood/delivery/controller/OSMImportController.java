/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.ths.onlinefood.delivery.controller;

import java.util.Map;

import com.ths.onlinefood.delivery.service.OSMDataImporter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/delivery/osm")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class OSMImportController {
    
    private final OSMDataImporter osmImporter;
    
    /**
     * Import dữ liệu đường thực tế cho TP.HCM
     */
    @PostMapping("/import-hcmc")
    public ResponseEntity<Map<String, String>> importHCMCRoads() {
        try {
            // Tọa độ bao phủ khu vực trung tâm TP.HCM
            // Quận 1, 3, 4, 5, 10, Phú Nhuận, Bình Thạnh
            double minLat = 10.75;  // Nam
            double minLon = 106.65; // Tây
            double maxLat = 10.82;  // Bắc
            double maxLon = 106.72; // Đông
            
            osmImporter.importRealRoadsFromOSM(minLat, minLon, maxLat, maxLon);
            
            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Đã import dữ liệu đường thực tế từ OpenStreetMap"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "status", "error",
                "message", "Lỗi: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Import cho khu vực tùy chỉnh
     */
    @PostMapping("/import-custom")
    public ResponseEntity<Map<String, String>> importCustomArea(
            @RequestParam double minLat,
            @RequestParam double minLon,
            @RequestParam double maxLat,
            @RequestParam double maxLon) {
        try {
            osmImporter.importRealRoadsFromOSM(minLat, minLon, maxLat, maxLon);
            
            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Đã import dữ liệu cho khu vực tùy chỉnh"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "status", "error",
                "message", "Lỗi: " + e.getMessage()
            ));
        }
    }
}