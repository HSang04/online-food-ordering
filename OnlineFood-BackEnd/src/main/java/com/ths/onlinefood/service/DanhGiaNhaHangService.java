package com.ths.onlinefood.service;

import com.ths.onlinefood.model.DanhGiaNhaHang;
import com.ths.onlinefood.repository.DanhGiaNhaHangRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class DanhGiaNhaHangService {

    private final DanhGiaNhaHangRepository repository;

    public List<DanhGiaNhaHang> findAll() {
        return repository.findAll();
    }

    public Optional<DanhGiaNhaHang> findById(Long id) {
        return repository.findById(id);
    }

    public DanhGiaNhaHang create(DanhGiaNhaHang danhGia) {
        danhGia.setThoiGianDanhGia(LocalDateTime.now());
        return repository.save(danhGia);
    }

    public DanhGiaNhaHang update(Long id, DanhGiaNhaHang newDG) {
        DanhGiaNhaHang dg = repository.findById(id).orElseThrow();
        dg.setSoSao(newDG.getSoSao());
        dg.setNoiDung(newDG.getNoiDung());
        dg.setNguoiDung(newDG.getNguoiDung());
        return repository.save(dg);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    public boolean existsById(Long id) {
        return repository.existsById(id);
    }
}
