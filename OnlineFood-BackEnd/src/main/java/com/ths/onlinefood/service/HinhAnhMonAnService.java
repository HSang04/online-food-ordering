package com.ths.onlinefood.service;

import com.ths.onlinefood.model.HinhAnhMonAn;
import com.ths.onlinefood.repository.HinhAnhMonAnRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class HinhAnhMonAnService {

    private final HinhAnhMonAnRepository hinhAnhMonAnRepository;

    public List<HinhAnhMonAn> getAll() {
        return hinhAnhMonAnRepository.findAll();
    }

    public List<HinhAnhMonAn> getByMonAnId(Long monAnId) {
        return hinhAnhMonAnRepository.findByMonAnId(monAnId);
    }

    public HinhAnhMonAn save(HinhAnhMonAn hinhAnhMonAn) {
        return hinhAnhMonAnRepository.save(hinhAnhMonAn);
    }

    public void delete(Long id) {
        hinhAnhMonAnRepository.deleteById(id);
    }
}
