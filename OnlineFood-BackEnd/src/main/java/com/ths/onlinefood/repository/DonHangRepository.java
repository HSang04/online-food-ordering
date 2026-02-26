package com.ths.onlinefood.repository;

import com.ths.onlinefood.model.DonHang;
import com.ths.onlinefood.model.NguoiDung;
import com.ths.onlinefood.model.TrangThaiDonHang_ENUM;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import org.springframework.data.jpa.repository.JpaRepository;
import jakarta.persistence.LockModeType;

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

    List<DonHang> findByTrangThaiAndNvGiaoHangIsNull(TrangThaiDonHang_ENUM trangThai);
    List<DonHang> findByNvGiaoHangIdAndTrangThai(Long shipperId, TrangThaiDonHang_ENUM trangThai);
    
        List<DonHang> findByThoiGianHoanThanhBetweenAndTrangThai(
        LocalDateTime tuNgay, 
        LocalDateTime denNgay, 
        TrangThaiDonHang_ENUM trangThai
    );

    // Pessimistic lock để tránh 2 shipper nhận cùng 1 đơn cùng lúc
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT d FROM DonHang d WHERE d.id = :id")
    Optional<DonHang> findByIdWithLock(@Param("id") Long id);
}

