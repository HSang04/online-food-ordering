package com.ths.onlinefood.controller;

import com.ths.onlinefood.model.ChiTietDonHang;
import com.ths.onlinefood.service.ChiTietDonHangService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chi-tiet-don-hang")
public class ChiTietDonHangController {

    private final ChiTietDonHangService chiTietDonHangService;

    public ChiTietDonHangController(ChiTietDonHangService chiTietDonHangService) {
        this.chiTietDonHangService = chiTietDonHangService;
    }

    @GetMapping
    public ResponseEntity<List<ChiTietDonHang>> getAll() {
        return ResponseEntity.ok(chiTietDonHangService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ChiTietDonHang> getById(@PathVariable Long id) {
        return chiTietDonHangService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
     @GetMapping("/don-hang/{donHangId}")
    public ResponseEntity<List<ChiTietDonHang>> getByDonHangId(@PathVariable Long donHangId) {
        List<ChiTietDonHang> list = chiTietDonHangService.getByDonHangId(donHangId);
        if (list.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(list);
    }

    @PostMapping
    public ResponseEntity<ChiTietDonHang> create(@RequestBody ChiTietDonHang chiTietDonHang) {
        return ResponseEntity.ok(chiTietDonHangService.save(chiTietDonHang));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ChiTietDonHang> update(@PathVariable Long id, @RequestBody ChiTietDonHang chiTietDonHang) {
        return chiTietDonHangService.findById(id)
                .map(existing -> {
                    chiTietDonHang.setId(id);
                    return ResponseEntity.ok(chiTietDonHangService.save(chiTietDonHang));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (chiTietDonHangService.findById(id).isPresent()) {
            chiTietDonHangService.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
