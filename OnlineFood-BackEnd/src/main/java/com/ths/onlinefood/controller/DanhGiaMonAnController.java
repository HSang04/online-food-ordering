package com.ths.onlinefood.controller;
import com.ths.onlinefood.model.DanhGiaMonAn;
import com.ths.onlinefood.service.DanhGiaMonAnService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/danh-gia-mon-an")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DanhGiaMonAnController {
    private final DanhGiaMonAnService service;

    @GetMapping
    public List<DanhGiaMonAn> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<DanhGiaMonAn> getById(@PathVariable Long id) {
        return service.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }


    @GetMapping("/mon-an/{monAnId}")
    public List<DanhGiaMonAn> getByMonAn(
            @PathVariable Long monAnId,
            @RequestParam(defaultValue = "moi_nhat") String sapXep) {
        return service.getByMonAnWithSort(monAnId, sapXep);
    }


    @GetMapping("/mon-an/{monAnId}/nguoi-dung/{nguoiDungId}")
    public ResponseEntity<DanhGiaMonAn> getUserReviewForDish(
            @PathVariable Long monAnId, 
            @PathVariable Long nguoiDungId) {
        return service.getUserReviewForDish(monAnId, nguoiDungId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

   
    @GetMapping("/mon-an/{monAnId}/thong-ke")
    public ResponseEntity<?> getReviewStats(@PathVariable Long monAnId) {
        return ResponseEntity.ok(service.getReviewStats(monAnId));
    }

    @PostMapping
    public DanhGiaMonAn create(@RequestBody DanhGiaMonAn danhGiaMonAn) {
        return service.create(danhGiaMonAn);
    }


    @PostMapping("/mon-an/{monAnId}/nguoi-dung/{nguoiDungId}")
    public ResponseEntity<DanhGiaMonAn> createOrUpdate(
            @PathVariable Long monAnId,
            @PathVariable Long nguoiDungId,
            @RequestBody DanhGiaMonAn danhGia) {
        return ResponseEntity.ok(service.createOrUpdateReview(monAnId, nguoiDungId, danhGia));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DanhGiaMonAn> update(@PathVariable Long id, @RequestBody DanhGiaMonAn newDG) {
        return service.update(id, newDG)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        return service.delete(id)
                ? ResponseEntity.ok().build()
                : ResponseEntity.notFound().build();
    }
}