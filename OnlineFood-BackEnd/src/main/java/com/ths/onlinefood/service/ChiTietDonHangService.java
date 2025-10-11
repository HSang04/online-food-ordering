package com.ths.onlinefood.service;

import com.ths.onlinefood.model.ChiTietDonHang;
import com.ths.onlinefood.repository.ChiTietDonHangRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ChiTietDonHangService {

    private final ChiTietDonHangRepository chiTietDonHangRepository;

    public ChiTietDonHangService(ChiTietDonHangRepository chiTietDonHangRepository) {
        this.chiTietDonHangRepository = chiTietDonHangRepository;
    }

    public List<ChiTietDonHang> findAll() {
        return chiTietDonHangRepository.findAll();
    }

    public Optional<ChiTietDonHang> findById(Long id) {
        return chiTietDonHangRepository.findById(id);
    }

    public ChiTietDonHang save(ChiTietDonHang chiTietDonHang) {
        return chiTietDonHangRepository.save(chiTietDonHang);
    }

    public void deleteById(Long id) {
        chiTietDonHangRepository.deleteById(id);
    }
    
      public List<ChiTietDonHang> getByDonHangId(Long donHangId) {
        return chiTietDonHangRepository.findByDonHangId(donHangId);
    }
}
