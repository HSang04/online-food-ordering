package com.ths.onlinefood.service;

import com.ths.onlinefood.model.KhuyenMai;
import com.ths.onlinefood.model.MonAn;
import com.ths.onlinefood.repository.KhuyenMaiRepository;
import com.ths.onlinefood.repository.MonAnRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class KhuyenMaiService {

    private final KhuyenMaiRepository khuyenMaiRepository;
    private final MonAnRepository monAnRepository;

    public List<KhuyenMai> getAll() {
        return khuyenMaiRepository.findAll();
    }

    public Optional<KhuyenMai> getById(Long id) {
        return khuyenMaiRepository.findById(id);
    }

    public KhuyenMai create(Long monAnId, double giaGiam, LocalDateTime thoiHan) {
        MonAn monAn = monAnRepository.findById(monAnId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy món ăn"));

        
        System.out.println(" ID = " + monAn.getId());
        KhuyenMai km = new KhuyenMai();
        km.setMonAn(monAn);
        km.setGiaGiam(giaGiam);
        km.setThoiHan(thoiHan);

        return khuyenMaiRepository.save(km);
    }

  public KhuyenMai update(Long monAnId, double giaGiam, LocalDateTime thoiHan) {
    KhuyenMai km = khuyenMaiRepository.findByMonAnId(monAnId)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy khuyến mãi cho món ăn ID = " + monAnId));
    System.out.println(monAnId + " + " + km.getId());
   
    km.setGiaGiam(giaGiam);
    km.setThoiHan(thoiHan);

    return khuyenMaiRepository.save(km);
}


public void delete(Long monAnId) {
    Optional<KhuyenMai> kmOpt = khuyenMaiRepository.findByMonAnId(monAnId);
    if (kmOpt.isPresent()) {
        KhuyenMai km = kmOpt.get();
        Long khuyenMaiId = km.getId(); 

        MonAn monAn = km.getMonAn();
        if (monAn != null) {
            monAn.setKhuyenMai(null);
            monAnRepository.save(monAn); 
        }

        khuyenMaiRepository.deleteById(khuyenMaiId); 
        System.out.println("✅ Đã xóa khuyến mãi ID = " + khuyenMaiId + " cho món ăn ID = " + monAnId);
    } else {
        System.out.println("❌ Không tìm thấy khuyến mãi cho món ăn ID = " + monAnId);
    }
}


}

