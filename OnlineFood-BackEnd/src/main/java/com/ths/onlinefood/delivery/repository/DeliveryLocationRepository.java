/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.ths.onlinefood.delivery.repository;

import com.ths.onlinefood.delivery.model.DeliveryLocation;
import com.ths.onlinefood.delivery.model.DeliveryStatus;
import com.ths.onlinefood.model.DonHang;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface DeliveryLocationRepository extends JpaRepository<DeliveryLocation, Long> {
    
    List<DeliveryLocation> findByDonHangOrderByTimestampDesc(DonHang donHang);
    
    @Query("SELECT d FROM DeliveryLocation d WHERE d.donHang = :donHang " +
           "ORDER BY d.timestamp DESC LIMIT 1")
    Optional<DeliveryLocation> findLatestByDonHang(@Param("donHang") DonHang donHang);
    
    @Query("SELECT d FROM DeliveryLocation d WHERE d.donHang.id = :donHangId " +
           "AND d.timestamp >= :since ORDER BY d.timestamp ASC")
    List<DeliveryLocation> findRecentLocations(@Param("donHangId") Long donHangId, 
                                                @Param("since") LocalDateTime since);
    
    @Query("SELECT d FROM DeliveryLocation d WHERE d.donHang.id = :donHangId " +
           "AND d.status = :status ORDER BY d.timestamp DESC LIMIT 1")
    Optional<DeliveryLocation> findLatestByDonHangAndStatus(@Param("donHangId") Long donHangId,
                                                             @Param("status") DeliveryStatus status);
    
    // Xóa các vị trí cũ (để dọn dẹp database)
    @Query("DELETE FROM DeliveryLocation d WHERE d.timestamp < :before")
    void deleteOldLocations(@Param("before") LocalDateTime before);
    
    // Đếm số lần cập nhật vị trí của đơn hàng
    @Query("SELECT COUNT(d) FROM DeliveryLocation d WHERE d.donHang.id = :donHangId")
    Long countByDonHangId(@Param("donHangId") Long donHangId);
}