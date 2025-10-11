package com.ths.onlinefood.controller;

import com.ths.onlinefood.service.GeoLocationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/khoang-cach")
@RequiredArgsConstructor
public class APIKhoangCachController {
    
    private final GeoLocationService geoLocationService;

    @GetMapping("/dia-chi")
    public ResponseEntity<?> tinhKhoangCachTuDiaChi(@RequestParam String diaChi) {
        try {
        
            if (diaChi == null || diaChi.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(
                    java.util.Map.of("error", "Vui lòng nhập địa chỉ giao hàng")
                );
            }
            
            if (diaChi.trim().length() < 10) {
                return ResponseEntity.badRequest().body(
                    java.util.Map.of("error", "Địa chỉ quá ngắn. Vui lòng nhập địa chỉ chi tiết hơn (số nhà, tên đường, phường, quận)")
                );
            }
            
            double[] latlng = geoLocationService.getLatLngFromAddress(diaChi);
            
           
            if (latlng == null || latlng.length < 2 || (latlng[0] == 0.0 && latlng[1] == 0.0)) {
                return ResponseEntity.badRequest().body(
                    java.util.Map.of("error", "Không thể xác định vị trí của địa chỉ này. Vui lòng nhập địa chỉ chi tiết hơn hoặc thử địa chỉ gần đó")
                );
            }
            
            double khoangCach = geoLocationService.tinhKhoangCach(latlng[0], latlng[1]);
            
            return ResponseEntity.ok(
                java.util.Map.of(
                    "lat", latlng[0],
                    "lng", latlng[1], 
                    "khoangCach_km", khoangCach
                )
            );
            
        } catch (IllegalArgumentException e) {
            
            return ResponseEntity.badRequest().body(
                java.util.Map.of("error", "Địa chỉ không hợp lệ: " + e.getMessage())
            );
            
        } catch (Exception e) {
            
            System.err.println("Lỗi khi xử lý địa chỉ: " + diaChi);
            e.printStackTrace();
            
        
            String errorMessage = "Không thể xử lý địa chỉ này. ";
            
           
            if (e.getMessage() != null) {
                String msg = e.getMessage().toLowerCase();
                if (msg.contains("network") || msg.contains("timeout") || msg.contains("connection")) {
                    errorMessage += "Lỗi kết nối mạng. Vui lòng thử lại sau.";
                } else if (msg.contains("not found") || msg.contains("zero_results")) {
                    errorMessage += "Không tìm thấy địa chỉ này. Vui lòng kiểm tra lại hoặc nhập địa chỉ chi tiết hơn.";
                } else if (msg.contains("invalid") || msg.contains("malformed")) {
                    errorMessage += "Định dạng địa chỉ không đúng. Vui lòng nhập theo dạng: số nhà, tên đường, phường, quận.";
                } else {
                    errorMessage += "Vui lòng thử nhập địa chỉ chi tiết hơn hoặc địa chỉ gần đó.";
                }
            } else {
                errorMessage += "Vui lòng thử nhập địa chỉ chi tiết hơn hoặc địa chỉ gần đó.";
            }
            
            return ResponseEntity.badRequest().body(
                java.util.Map.of("error", errorMessage)
            );
        }
    }
}