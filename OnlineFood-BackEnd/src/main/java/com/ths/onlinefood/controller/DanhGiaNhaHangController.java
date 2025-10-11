package com.ths.onlinefood.controller;

import com.ths.onlinefood.model.DanhGiaNhaHang;
import com.ths.onlinefood.service.DanhGiaNhaHangService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


import java.util.List;


@RestController
@RequestMapping("/api/danh-gia-nha-hang")
@RequiredArgsConstructor
public class DanhGiaNhaHangController {

    private final DanhGiaNhaHangService service;

    @GetMapping
    public List<DanhGiaNhaHang> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<DanhGiaNhaHang> getById(@PathVariable Long id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public DanhGiaNhaHang create(@RequestBody DanhGiaNhaHang danhGia) {
        return service.create(danhGia);
    }

    @PutMapping("/{id}")
    public ResponseEntity<DanhGiaNhaHang> update(@PathVariable Long id, @RequestBody DanhGiaNhaHang newDG) {
        try {
            return ResponseEntity.ok(service.update(id, newDG));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!service.existsById(id)) return ResponseEntity.notFound().build();
        service.delete(id);
        return ResponseEntity.ok().build();
    }
}
