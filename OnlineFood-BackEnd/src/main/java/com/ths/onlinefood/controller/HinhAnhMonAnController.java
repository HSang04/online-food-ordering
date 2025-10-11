package com.ths.onlinefood.controller;

import com.ths.onlinefood.model.HinhAnhMonAn;
import com.ths.onlinefood.service.HinhAnhMonAnService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/hinh-anh")
@RequiredArgsConstructor
public class HinhAnhMonAnController {

    private final HinhAnhMonAnService hinhAnhMonAnService;

    @GetMapping("/monan/{monAnId}")
    public List<HinhAnhMonAn> getByMonAn(@PathVariable Long monAnId) {
        return hinhAnhMonAnService.getByMonAnId(monAnId);
    }

    @PostMapping
    public HinhAnhMonAn addImage(@RequestBody HinhAnhMonAn hinhAnhMonAn) {
        return hinhAnhMonAnService.save(hinhAnhMonAn);
    }

    @DeleteMapping("/{id}")
    public void deleteImage(@PathVariable Long id) {
        hinhAnhMonAnService.delete(id);
    }
}
