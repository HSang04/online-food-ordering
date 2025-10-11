package com.ths.onlinefood.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ths.onlinefood.dto.MonAnDTO;
import com.ths.onlinefood.model.HinhAnhMonAn;
import com.ths.onlinefood.model.MonAn;
import com.ths.onlinefood.service.MonAnService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/mon-an")
@RequiredArgsConstructor
public class MonAnController {
    
    private final MonAnService monAnService;

    
    @GetMapping
    public List<MonAn> getAll() {
        return monAnService.getAll();
    }

    
    @GetMapping("/dto")
    public ResponseEntity<List<MonAnDTO>> getAllDTO() {
        List<MonAnDTO> dsMonAn = monAnService.getAllDTOs();
        return ResponseEntity.ok(dsMonAn);
    }

    @GetMapping("/active")
    public ResponseEntity<List<MonAnDTO>> getActiveMonAn() {
        List<MonAnDTO> dsMonAn = monAnService.getActiveDTOs();
        return ResponseEntity.ok(dsMonAn);
    }

   
    @GetMapping("/{id}")
    public ResponseEntity<MonAn> getById(@PathVariable Long id) {
        return monAnService.getById(id)
                .map(monAn -> {
                    // Trigger lazy loading
                    monAn.getHinhAnhMonAns().size();
                    return ResponseEntity.ok(monAn);
                })
                .orElse(ResponseEntity.notFound().build());
    }

  
    @GetMapping("/{id}/dto")
    public ResponseEntity<MonAnDTO> getByIdDTO(@PathVariable Long id) {
        Optional<MonAnDTO> monAn = monAnService.getDTOById(id);
        return monAn.map(ResponseEntity::ok)
                   .orElse(ResponseEntity.notFound().build());
    }

  
    @GetMapping("/{id}/details")
    public ResponseEntity<MonAn> getMonAnDetailsById(@PathVariable Long id) {
        Optional<MonAn> monAn = monAnService.getImagesByMonAnId(id);
        return monAn.map(ResponseEntity::ok)
                   .orElse(ResponseEntity.notFound().build());
    }

    
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MonAn> create(
            @RequestPart("monAn") String monAnJson,
            @RequestPart(value = "images", required = false) MultipartFile[] imageFiles) {
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            MonAn monAn = objectMapper.readValue(monAnJson, MonAn.class);
            return ResponseEntity.ok(monAnService.create(monAn, imageFiles));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    
    @PutMapping(path = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MonAn> update(
            @PathVariable Long id,
            @RequestPart("monAn") String monAnJson,
            @RequestPart(value = "images", required = false) MultipartFile[] imageFiles) {
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            MonAnDTO dto = objectMapper.readValue(monAnJson, MonAnDTO.class);
            MonAn updated = monAnService.update(id, dto, imageFiles);
            return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

   
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        return monAnService.delete(id)
                ? ResponseEntity.ok().build()
                : ResponseEntity.notFound().build();
    }

    @GetMapping("/search")
    public List<MonAn> search(@RequestParam String keyword) {
        return monAnService.searchByTenMon(keyword);
    }

  
    @GetMapping("/search/dto")
    public ResponseEntity<List<MonAnDTO>> searchDTO(@RequestParam String keyword) {
        List<MonAn> dsMonAn = monAnService.searchByTenMon(keyword);
        List<MonAnDTO> dsMonAnDTO = dsMonAn.stream()
                .map(monAnService::convertToDto)
                .toList();
        return ResponseEntity.ok(dsMonAnDTO);
    }

  
    @GetMapping("/on-sale")
    public ResponseEntity<List<MonAnDTO>> getMonAnOnSale() {
        List<MonAnDTO> dsMonAnKhuyenMai = monAnService.getAllDTOs()
                .stream()
                .filter(MonAnDTO::isCoKhuyenMai)
                .toList();
        return ResponseEntity.ok(dsMonAnKhuyenMai);
    }

  
    @GetMapping("/category/{categoryId}")
    public ResponseEntity<List<MonAnDTO>> getMonAnByCategory(@PathVariable Long categoryId) {
        List<MonAnDTO> dsMonAn = monAnService.getAllDTOs()
                .stream()
                .filter(mon -> mon.getDanhMuc() != null && mon.getDanhMuc().getId().equals(categoryId))
                .toList();
        return ResponseEntity.ok(dsMonAn);
    }

   
    @PostMapping("/{id}/images")
    public ResponseEntity<HinhAnhMonAn> addImage(
            @PathVariable Long id,
            @RequestParam("image") MultipartFile imageFile) {
        try {
            HinhAnhMonAn savedImage = monAnService.saveImage(id, imageFile);
            return savedImage != null ? ResponseEntity.ok(savedImage) : ResponseEntity.notFound().build();
        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

   
    @DeleteMapping("/images/{imageId}")
    public ResponseEntity<Void> deleteImage(@PathVariable Long imageId) {
        try {
            monAnService.deleteImage(imageId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    
    @GetMapping("/{id}/price")
    public ResponseEntity<Double> getGiaBan(@PathVariable Long id) {
        Optional<MonAn> monAn = monAnService.getById(id);
        if (monAn.isPresent()) {
            double giaBan = monAnService.getGiaBan(monAn.get());
            return ResponseEntity.ok(giaBan);
        }
        return ResponseEntity.notFound().build();
    }

    
    @GetMapping("/{id}/on-sale")
    public ResponseEntity<Boolean> isOnSale(@PathVariable Long id) {
        Optional<MonAn> monAn = monAnService.getById(id);
        if (monAn.isPresent()) {
            boolean isOnSale = monAnService.isOnSale(monAn.get());
            return ResponseEntity.ok(isOnSale);
        }
        return ResponseEntity.notFound().build();
    }
}