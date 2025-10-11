package com.ths.onlinefood.repository;

import com.ths.onlinefood.model.HoiThoai;
import com.ths.onlinefood.model.NguoiDung;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface HoiThoaiRepository extends JpaRepository<HoiThoai, Long> {
    
 
    Optional<HoiThoai> findByKhachHangId(Long khachHangId);
    
    // Lấy tất cả hội thoại có tin nhắn (cho admin/staff)
    @Query("SELECT DISTINCT h FROM HoiThoai h " +
           "JOIN TinNhan t ON t.hoiThoai.id = h.id " +
           "ORDER BY h.thoiGianTao DESC")
    List<HoiThoai> findAllWithMessages();
    
    // Tìm hoặc tạo hội thoại cho khách hàng
    @Query("SELECT h FROM HoiThoai h WHERE h.khachHang.id = :khachHangId")
    Optional<HoiThoai> findByKhachHang(@Param("khachHangId") Long khachHangId);
}