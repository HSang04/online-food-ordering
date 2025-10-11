/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.ths.onlinefood.controller;

import com.ths.onlinefood.model.ThongTinCuaHang;
import com.ths.onlinefood.service.ThongTinCuaHangService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/thong-tin-cua-hang")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ThongTinCuaHangController {
    
    private final ThongTinCuaHangService service;
    
 
    @GetMapping
    public ResponseEntity<?> getCuaHang() {
        try {
            Optional<ThongTinCuaHang> cuaHang = service.getCuaHang();
            if (cuaHang.isPresent()) {
                return ResponseEntity.ok(cuaHang.get());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Có lỗi xảy ra: " + e.getMessage());
        }
    }
    
  
    @PutMapping
    public ResponseEntity<?> updateCuaHang(@RequestBody ThongTinCuaHang cuaHang) {
        try {
            ThongTinCuaHang updated = service.updateCuaHang(cuaHang);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Có lỗi xảy ra: " + e.getMessage());
        }
    }
    
  
    @GetMapping("/check-mo")
    public ResponseEntity<?> checkCuaHangStatus() {
        try {
            // Sử dụng Optional version để xử lý null safety tốt hơn
            Optional<ThongTinCuaHang> cuaHangOpt = service.getCuaHangStatusOptional();
            
            if (cuaHangOpt.isPresent()) {
                ThongTinCuaHang cuaHang = cuaHangOpt.get();
                return ResponseEntity.ok(cuaHang);
            } else {
                // Trả về thông tin mặc định khi chưa có cửa hàng
                return ResponseEntity.ok().body(new ErrorResponse(
                    false, 
                    "Chưa có thông tin cửa hàng", 
                    "", 
                    ""
                ));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Có lỗi xảy ra: " + e.getMessage());
        }
    }
    
  
    @GetMapping("/is-open")
    public ResponseEntity<?> isCuaHangMo() {
        try {
            boolean isOpen = service.isCuaHangMo();
            return ResponseEntity.ok().body(new SimpleStatusResponse(isOpen));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Có lỗi xảy ra: " + e.getMessage());
        }
    }
 // 90 -145 :debug - xong xoa
    @GetMapping("/status")
    public ResponseEntity<?> getTrangThaiCuaHang() {
        try {
            String trangThai = service.getTrangThaiCuaHang();
            return ResponseEntity.ok().body(new StatusTextResponse(trangThai));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Có lỗi xảy ra: " + e.getMessage());
        }
    }
    
 
    public static class ErrorResponse {
        private boolean isOpen;
        private String thongTin;
        private String gioMoCua;
        private String gioDongCua;
        
        public ErrorResponse(boolean isOpen, String thongTin, String gioMoCua, String gioDongCua) {
            this.isOpen = isOpen;
            this.thongTin = thongTin;
            this.gioMoCua = gioMoCua;
            this.gioDongCua = gioDongCua;
        }
        
      
        public boolean isOpen() { return isOpen; }
        public boolean getIsOpen() { return isOpen; }
        public String getThongTin() { return thongTin; }
        public String getGioMoCua() { return gioMoCua; }
        public String getGioDongCua() { return gioDongCua; }
    }
    
  
    public static class SimpleStatusResponse {
        private boolean isOpen;
        
        public SimpleStatusResponse(boolean isOpen) {
            this.isOpen = isOpen;
        }
        
        public boolean isOpen() { return isOpen; }
        public boolean getIsOpen() { return isOpen; }
    }
    
 
    public static class StatusTextResponse {
        private String trangThai;
        
        public StatusTextResponse(String trangThai) {
            this.trangThai = trangThai;
        }
        
        public String getTrangThai() { return trangThai; }
    }
}