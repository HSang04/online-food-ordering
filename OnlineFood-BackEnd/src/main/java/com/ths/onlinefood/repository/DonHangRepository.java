package com.ths.onlinefood.repository;

import com.ths.onlinefood.model.DonHang;
import com.ths.onlinefood.model.NguoiDung;
import com.ths.onlinefood.model.TrangThaiDonHang_ENUM;
import java.util.List;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DonHangRepository extends JpaRepository<DonHang, Long> {
    
    List<DonHang> findByNguoiDungOrderByNgayTaoDesc(NguoiDung nguoiDung);
    List<DonHang> findByNguoiDung_IdOrderByNgayTaoDesc(Long nguoiDungId);
    
    List<DonHang> findByNgayTaoBetweenAndTrangThai(
        LocalDateTime fromDate, LocalDateTime toDate, TrangThaiDonHang_ENUM trangThai);
    
  
   
    @Query("SELECT v.maVoucher, v.moTa, v.loai, v.giaTri, COUNT(d) " +
           "FROM DonHang d JOIN d.voucher v " +
           "WHERE d.ngayTao BETWEEN :fromDate AND :toDate " +
           "AND d.trangThai = :trangThai " +
           "GROUP BY v.maVoucher, v.moTa, v.loai, v.giaTri " +
           "ORDER BY COUNT(d) DESC")
    List<Object[]> findVoucherUsageStatsBasic(
        @Param("fromDate") LocalDateTime fromDate,
        @Param("toDate") LocalDateTime toDate,
        @Param("trangThai") TrangThaiDonHang_ENUM trangThai
    );
    
    long countByTrangThai(TrangThaiDonHang_ENUM trangThai);
}