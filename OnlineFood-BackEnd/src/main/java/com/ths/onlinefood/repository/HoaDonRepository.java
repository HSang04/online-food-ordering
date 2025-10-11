package com.ths.onlinefood.repository;

import com.ths.onlinefood.model.HoaDon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface HoaDonRepository extends JpaRepository<HoaDon, Long> {
    
   
    @Query("SELECT h FROM HoaDon h WHERE h.donHang.id = :donHangId")
    Optional<HoaDon> findByDonHangId(@Param("donHangId") Long donHangId);
    
   
    Optional<HoaDon> findByMaGD(String maGD);
    
  
    List<HoaDon> findByTrangThai(String trangThai);
    
   
    List<HoaDon> findByPhuongThuc(String phuongThuc);
    
    
    @Query("SELECT CASE WHEN COUNT(h) > 0 THEN true ELSE false END FROM HoaDon h WHERE h.donHang.id = :donHangId")
    boolean existsByDonHangId(@Param("donHangId") Long donHangId);
    
  
   List<HoaDon> findByDonHang_NguoiDung_IdOrderByThoiGianThanhToanDesc(Long nguoiDungId);
   
    // HoaDonRepository.java
    @Query("SELECT hd FROM HoaDon hd " +
           "JOIN FETCH hd.donHang dh " +
           "LEFT JOIN FETCH dh.chiTietDonHang ctdh " +
           "LEFT JOIN FETCH ctdh.monAn " +
           "WHERE hd.id = :id")
    Optional<HoaDon> findByIdWithDetails(@Param("id") Long id);

    @Query("SELECT hd FROM HoaDon hd " +
           "JOIN FETCH hd.donHang dh " +
           "LEFT JOIN FETCH dh.chiTietDonHang ctdh " +
           "LEFT JOIN FETCH ctdh.monAn " +
           "WHERE dh.id = :donHangId")
    Optional<HoaDon> findByDonHangIdWithDetails(@Param("donHangId") Long donHangId);
    
 


}