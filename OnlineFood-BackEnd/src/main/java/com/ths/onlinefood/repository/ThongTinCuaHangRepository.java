/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.ths.onlinefood.repository;

import com.ths.onlinefood.model.ThongTinCuaHang;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalTime;
import java.util.Optional;

@Repository
public interface ThongTinCuaHangRepository extends JpaRepository<ThongTinCuaHang, Long> {
    
  
    @Query("SELECT t FROM ThongTinCuaHang t ORDER BY t.id LIMIT 1")
    Optional<ThongTinCuaHang> findCuaHang();
    
   
    @Query("SELECT COUNT(t) > 0 FROM ThongTinCuaHang t WHERE :currentTime BETWEEN t.gioMoCua AND t.gioDongCua")
    boolean isCuaHangMo(@Param("currentTime") LocalTime currentTime);
    
  
    @Query("SELECT t FROM ThongTinCuaHang t WHERE :currentTime BETWEEN t.gioMoCua AND t.gioDongCua")
    Optional<ThongTinCuaHang> findCuaHangNeuMo(@Param("currentTime") LocalTime currentTime);
}