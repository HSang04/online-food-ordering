package com.ths.onlinefood.controller;

import com.ths.onlinefood.model.HoaDon;
import com.ths.onlinefood.service.HoaDonService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/hoa-don")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class HoaDonController {

    private final HoaDonService hoaDonService;

    @GetMapping
    public List<HoaDon> getAll() {
        return hoaDonService.getAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<HoaDon> getById(@PathVariable Long id) {
        return hoaDonService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/don-hang/{donHangId}")
    public ResponseEntity<?> getByDonHangId(@PathVariable Long donHangId) {
        try {
            // AppConfig đã kiểm tra role, chỉ cần lấy hóa đơn
            HoaDon hoaDon = hoaDonService.getByDonHangIdWithEmailCheck(
                    donHangId, "admin@system.com", true
            );
            if (hoaDon == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(hoaDon);
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "message", "Có lỗi xảy ra khi tải hóa đơn: " + e.getMessage()
            ));
        }
    }

    /**
     * Tạo hóa đơn từ đơn hàng (dùng cho COD)
     */
    @PostMapping("/tao-tu-don-hang/{donHangId}")
    public ResponseEntity<?> taoHoaDonTuDonHang(@PathVariable Long donHangId) {
        try {
            HoaDon hoaDon = hoaDonService.taoHoaDonCOD(donHangId);
            return ResponseEntity.ok(hoaDon);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * Tạo hóa đơn cho thanh toán VNPay
     */
    @PostMapping("/tao-vnpay")
    public ResponseEntity<?> taoHoaDonVNPay(@RequestBody Map<String, Object> request) {
        try {
            Long donHangId = Long.valueOf(request.get("donHangId").toString());
            String vnpTransactionNo = request.get("vnpTransactionNo").toString();
            HoaDon hoaDon = hoaDonService.taoHoaDonVNPay(donHangId, vnpTransactionNo);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Tạo hóa đơn thành công",
                    "hoaDon", hoaDon
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    @PutMapping("/cap-nhat-hoan-thanh/{donHangId}")
    public ResponseEntity<?> capNhatThanhToanKhiHoanThanh(@PathVariable Long donHangId) {
        try {
            hoaDonService.capNhatThanhToanKhiHoanThanh(donHangId);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Đã cập nhật trạng thái hóa đơn thành công"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    @PostMapping
    public ResponseEntity<HoaDon> create(@RequestBody HoaDon hoaDon) {
        try {
            HoaDon created = hoaDonService.create(hoaDon);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<HoaDon> update(@PathVariable Long id, @RequestBody HoaDon hoaDon) {
        HoaDon updated = hoaDonService.update(id, hoaDon);
        return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        boolean deleted = hoaDonService.delete(id);
        return deleted ? ResponseEntity.ok().build() : ResponseEntity.notFound().build();
    }
}