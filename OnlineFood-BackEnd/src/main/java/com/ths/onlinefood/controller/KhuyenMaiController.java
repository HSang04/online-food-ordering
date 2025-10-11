package com.ths.onlinefood.controller;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.ths.onlinefood.model.KhuyenMai;
import com.ths.onlinefood.service.KhuyenMaiService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/khuyen-mai")
@RequiredArgsConstructor
public class KhuyenMaiController {

    private final KhuyenMaiService khuyenMaiService;

    @GetMapping
    public ResponseEntity<List<KhuyenMai>> getAll() {
        return ResponseEntity.ok(khuyenMaiService.getAll());
    }

    @PostMapping
    public ResponseEntity<KhuyenMai> create(@RequestBody KhuyenMaiRequest req) {
        return ResponseEntity.ok(
                khuyenMaiService.create(req.getMonAnId(), req.getGiaGiam(), req.getThoiHan())
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<KhuyenMai> update(@PathVariable Long id, @RequestBody KhuyenMaiRequest req) {
       
        return ResponseEntity.ok(
                khuyenMaiService.update(id, req.getGiaGiam(), req.getThoiHan())
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        khuyenMaiService.delete(id);
        return ResponseEntity.noContent().build();
    }

  @Data
public static class KhuyenMaiRequest {
    private Long monAnId;
    private double giaGiam;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss") 
    private LocalDateTime thoiHan;
}
}
