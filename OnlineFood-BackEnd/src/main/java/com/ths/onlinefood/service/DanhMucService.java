package com.ths.onlinefood.service;

import com.ths.onlinefood.model.DanhMuc;
import com.ths.onlinefood.repository.DanhMucRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class DanhMucService {

    private final DanhMucRepository repository;

    public List<DanhMuc> getAll() {
        return repository.findAll();
    }

    public Optional<DanhMuc> getById(Long id) {
        return repository.findById(id);
    }

    public DanhMuc save(DanhMuc danhMuc) {
        return repository.save(danhMuc);
    }

    public Optional<DanhMuc> update(Long id, DanhMuc newDM) {
        return repository.findById(id).map(dm -> {
            dm.setTenDanhMuc(newDM.getTenDanhMuc());
            dm.setMoTa(newDM.getMoTa());
            return repository.save(dm);
        });
    }

    public boolean delete(Long id) {
        if (!repository.existsById(id)) return false;
        repository.deleteById(id);
        return true;
    }
}
