package com.ths.onlinefood.controller;

import com.ths.onlinefood.model.DonHang;
import com.ths.onlinefood.request.DonHangRequest;
import com.ths.onlinefood.request.UpdateTrangThaiRequest;
import com.ths.onlinefood.service.DonHangService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/don-hang")
@RequiredArgsConstructor
public class DonHangController {

    private final DonHangService donHangService;

    @GetMapping
    public List<DonHang> getAll() {
        return donHangService.getAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<DonHang> getById(@PathVariable Long id) {
        return donHangService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

  
  @PostMapping("/dat-hang")
    @Transactional
    public ResponseEntity<DonHang> create(@RequestBody DonHangRequest request) {
        try {
            DonHang donHang = donHangService.createFromRequest(request);
            return ResponseEntity.ok(donHang);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<DonHang> update(@PathVariable Long id, @RequestBody DonHang donHang) {
        DonHang updated = donHangService.update(id, donHang);
        return updated == null ? ResponseEntity.notFound().build() : ResponseEntity.ok(updated);
    }
    
    @PatchMapping("/trang-thai/{id}")
    public ResponseEntity<DonHang> updateTrangThai(
            @PathVariable Long id,
            @RequestBody UpdateTrangThaiRequest request
    ) {
        try {
            DonHang updated = donHangService.updateTrangThai(id, request.getTrangThai());
            return updated == null ? ResponseEntity.notFound().build() : ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }


    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        return donHangService.delete(id)
                ? ResponseEntity.ok().build()
                : ResponseEntity.notFound().build();
    }
    
    @GetMapping("/nguoi-dung/{nguoiDungId}")
    public ResponseEntity<List<DonHang>> getDonHangByNguoiDung(@PathVariable Long nguoiDungId) {
        try {
            List<DonHang> donHangs = donHangService.getDonHangByNguoiDungId(nguoiDungId);
            return ResponseEntity.ok(donHangs);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

  
    @GetMapping("/nguoi-dung")
    public ResponseEntity<List<DonHang>> getDonHangByNguoiDungParam(@RequestParam Long nguoiDungId) {
        try {
            List<DonHang> donHangs = donHangService.getDonHangByNguoiDungId(nguoiDungId);
            return ResponseEntity.ok(donHangs);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PatchMapping("/huy/{id}")
    public ResponseEntity<DonHang> huyDonHang(
            @PathVariable Long id,
            @RequestParam Long nguoiDungId
    ) {
        try {
            DonHang updated = donHangService.huyDonHang(id, nguoiDungId);
            if (updated == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }
}
