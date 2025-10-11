package com.ths.onlinefood.repository;

import com.ths.onlinefood.model.GioHang;
import com.ths.onlinefood.model.NguoiDung;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface GioHangRepository extends JpaRepository<GioHang, Long> {
    List<GioHang> findByNguoiDung(NguoiDung nguoiDung);
    Optional<GioHang> findByNguoiDungAndMonAn_Id(NguoiDung nguoiDung, Long monAnId);
//    void deleteByNguoiDung(NguoiDung nguoiDung);
    
    @Transactional
    @Modifying
    void deleteAllByNguoiDung(NguoiDung nguoiDung);
    
    
   
//    @Query("SELECT gh FROM GioHang gh WHERE gh.nguoiDung = :nguoiDung AND gh.monAn.trangThai = 1")
//    List<GioHang> findByNguoiDungAndMonAnTrangThai(@Param("nguoiDung") NguoiDung nguoiDung);
//    
    
    List<GioHang> findByNguoiDungAndMonAn_TrangThai(NguoiDung nguoiDung, Integer trangThai);
    
}
