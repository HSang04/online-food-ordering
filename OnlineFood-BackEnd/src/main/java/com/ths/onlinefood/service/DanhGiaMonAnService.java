package com.ths.onlinefood.service;
import com.ths.onlinefood.model.DanhGiaMonAn;
import com.ths.onlinefood.model.MonAn;
import com.ths.onlinefood.model.NguoiDung;
import com.ths.onlinefood.repository.DanhGiaMonAnRepository;
import com.ths.onlinefood.repository.MonAnRepository;
import com.ths.onlinefood.repository.NguoiDungRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class DanhGiaMonAnService {
    private final DanhGiaMonAnRepository repository;
    private final MonAnRepository monAnRepository;
    private final NguoiDungRepository nguoiDungRepository;

    public List<DanhGiaMonAn> getAll() {
        return repository.findAll();
    }

    public Optional<DanhGiaMonAn> getById(Long id) {
        return repository.findById(id);
    }

    // Lấy đánh giá theo món ăn với sắp xếp
    public List<DanhGiaMonAn> getByMonAnWithSort(Long monAnId, String sapXep) {
        Sort sort;
        switch (sapXep) {
            case "cu_nhat":
                sort = Sort.by(Sort.Direction.ASC, "thoiGianDanhGia");
                break;
            case "tich_cuc":
                sort = Sort.by(Sort.Direction.DESC, "soSao")
                          .and(Sort.by(Sort.Direction.DESC, "thoiGianDanhGia"));
                break;
            case "tieu_cuc":
                sort = Sort.by(Sort.Direction.ASC, "soSao")
                          .and(Sort.by(Sort.Direction.DESC, "thoiGianDanhGia"));
                break;
            default: // moi_nhat
                sort = Sort.by(Sort.Direction.DESC, "thoiGianDanhGia");
                break;
        }
        return repository.findByMonAnIdOrderByCustom(monAnId, sort);
    }

   
    public Optional<DanhGiaMonAn> getUserReviewForDish(Long monAnId, Long nguoiDungId) {
        return repository.findByMonAnIdAndNguoiDungId(monAnId, nguoiDungId);
    }

  
    public Map<String, Object> getReviewStats(Long monAnId) {
        Map<String, Object> stats = new HashMap<>();
        List<DanhGiaMonAn> reviews = repository.findByMonAnId(monAnId);
        
        if (reviews.isEmpty()) {
            stats.put("tongSoDanhGia", 0);
            stats.put("diemTrungBinh", 0.0);
            stats.put("phanPhoSao", new int[]{0, 0, 0, 0, 0});
            return stats;
        }

        int tongSao = reviews.stream().mapToInt(DanhGiaMonAn::getSoSao).sum();
        double diemTrungBinh = (double) tongSao / reviews.size();
        
        int[] phanPhoSao = new int[5]; 
        for (DanhGiaMonAn review : reviews) {
            phanPhoSao[review.getSoSao() - 1]++;
        }

        stats.put("tongSoDanhGia", reviews.size());
        stats.put("diemTrungBinh", Math.round(diemTrungBinh * 10.0) / 10.0);
        stats.put("phanPhoSao", phanPhoSao);
        
        return stats;
    }

    public DanhGiaMonAn create(DanhGiaMonAn danhGia) {
        danhGia.setThoiGianDanhGia(LocalDateTime.now());
        return repository.save(danhGia);
    }

    // Tạo hoặc cập nhật đánh giá
    public DanhGiaMonAn createOrUpdateReview(Long monAnId, Long nguoiDungId, DanhGiaMonAn danhGiaData) {
        MonAn monAn = monAnRepository.findById(monAnId)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy món ăn"));
        NguoiDung nguoiDung = nguoiDungRepository.findById(nguoiDungId)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        Optional<DanhGiaMonAn> existingReview = repository.findByMonAnIdAndNguoiDungId(monAnId, nguoiDungId);
        
        if (existingReview.isPresent()) {
            // Cập nhật đánh giá hiện có
            DanhGiaMonAn review = existingReview.get();
            review.setSoSao(danhGiaData.getSoSao());
            review.setNoiDung(danhGiaData.getNoiDung());
            review.setThoiGianDanhGia(LocalDateTime.now());
            return repository.save(review);
        } else {
            // Tạo đánh giá mới
            DanhGiaMonAn newReview = new DanhGiaMonAn();
            newReview.setMonAn(monAn);
            newReview.setNguoiDung(nguoiDung);
            newReview.setSoSao(danhGiaData.getSoSao());
            newReview.setNoiDung(danhGiaData.getNoiDung());
            newReview.setThoiGianDanhGia(LocalDateTime.now());
            return repository.save(newReview);
        }
    }

    public Optional<DanhGiaMonAn> update(Long id, DanhGiaMonAn newDG) {
        return repository.findById(id).map(dg -> {
            dg.setSoSao(newDG.getSoSao());
            dg.setNoiDung(newDG.getNoiDung());
            dg.setThoiGianDanhGia(LocalDateTime.now());
            return repository.save(dg);
        });
    }

    public boolean delete(Long id) {
        if (!repository.existsById(id)) return false;
        repository.deleteById(id);
        return true;
    }
}