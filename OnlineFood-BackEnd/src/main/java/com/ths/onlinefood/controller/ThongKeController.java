package com.ths.onlinefood.controller;

import com.ths.onlinefood.service.ThongKeService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/thong-ke")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ThongKeController {

    private final ThongKeService thongKeService;

    /**
     * Thống kê doanh thu theo ngày
     */
    @GetMapping("/doanh-thu/ngay")
    public ResponseEntity<Map<String, Object>> getDoanhThuTheoNgay(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate tuNgay,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate denNgay) {
        
        try {
            Map<String, Object> result = thongKeService.getDoanhThuTheoNgay(tuNgay, denNgay);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Thống kê doanh thu theo tháng
     */
    @GetMapping("/doanh-thu/thang")
    public ResponseEntity<Map<String, Object>> getDoanhThuTheoThang(
            @RequestParam int nam) {
        
        try {
            Map<String, Object> result = thongKeService.getDoanhThuTheoThang(nam);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Thống kê món ăn bán chạy
     */
    @GetMapping("/mon-an/ban-chay")
    public ResponseEntity<Map<String, Object>> getMonAnBanChay(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate tuNgay,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate denNgay,
            @RequestParam(defaultValue = "10") int limit) {
        
        try {
            Map<String, Object> result = thongKeService.getMonAnBanChay(tuNgay, denNgay, limit);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Thống kê voucher đã sử dụng
     */
    @GetMapping("/voucher")
    public ResponseEntity<Map<String, Object>> getThongKeVoucher(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate tuNgay,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate denNgay) {
        
        try {
            Map<String, Object> result = thongKeService.getThongKeVoucher(tuNgay, denNgay);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Thống kê tổng quan
     */
    @GetMapping("/tong-quan")
    public ResponseEntity<Map<String, Object>> getThongKeTongQuan() {
        try {
            Map<String, Object> result = thongKeService.getThongKeTongQuan();
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * So sánh doanh thu giữa 2 kỳ
     */
    @GetMapping("/so-sanh")
    public ResponseEntity<Map<String, Object>> soSanhDoanhThu(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate tuNgay1,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate denNgay1,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate tuNgay2,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate denNgay2) {
        
        try {
            Map<String, Object> result = thongKeService.soSanhDoanhThu(tuNgay1, denNgay1, tuNgay2, denNgay2);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Thống kê nhanh - dữ liệu cho dashboard
     */
    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboardData() {
        try {
            LocalDate today = LocalDate.now();
            LocalDate weekAgo = today.minusDays(7);
            LocalDate monthAgo = today.minusMonths(1);
            
            // Lấy nhiều loại thống kê cùng lúc
            Map<String, Object> tongQuan = thongKeService.getThongKeTongQuan();
            Map<String, Object> monBanChay = thongKeService.getMonAnBanChay(weekAgo, today, 5);
            Map<String, Object> voucherStats = thongKeService.getThongKeVoucher(monthAgo, today);
            
            Map<String, Object> result = Map.of(
                "tongQuan", tongQuan,
                "monBanChay", monBanChay,
                "voucherStats", voucherStats
            );
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Thống kê theo tuần hiện tại
     */
    @GetMapping("/tuan-hien-tai")
    public ResponseEntity<Map<String, Object>> getThongKeTuanHienTai() {
        try {
            LocalDate today = LocalDate.now();
            LocalDate startOfWeek = today.minusDays(today.getDayOfWeek().getValue() - 1);
            LocalDate endOfWeek = startOfWeek.plusDays(6);
            
            Map<String, Object> result = thongKeService.getDoanhThuTheoNgay(startOfWeek, endOfWeek);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Thống kê theo tháng hiện tại
     */
    @GetMapping("/thang-hien-tai")
    public ResponseEntity<Map<String, Object>> getThongKeThangHienTai() {
        try {
            LocalDate today = LocalDate.now();
            LocalDate startOfMonth = today.withDayOfMonth(1);
            LocalDate endOfMonth = today.withDayOfMonth(today.lengthOfMonth());
            
            Map<String, Object> result = thongKeService.getDoanhThuTheoNgay(startOfMonth, endOfMonth);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}