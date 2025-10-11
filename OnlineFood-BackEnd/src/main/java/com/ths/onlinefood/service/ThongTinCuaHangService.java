package com.ths.onlinefood.service;

import com.ths.onlinefood.model.ThongTinCuaHang;
import com.ths.onlinefood.repository.ThongTinCuaHangRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class ThongTinCuaHangService {
    
    private final ThongTinCuaHangRepository repository;
    
    private static final ZoneId VIETNAM_TIMEZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    
  
    private LocalTime getCurrentTimeInVietnam() {
        return ZonedDateTime.now(VIETNAM_TIMEZONE).toLocalTime();
    }
    
  
    public Optional<ThongTinCuaHang> getCuaHang() {
        return repository.findCuaHang();
    }
    
  
    public ThongTinCuaHang updateCuaHang(ThongTinCuaHang cuaHangMoi) {
        Optional<ThongTinCuaHang> cuaHangOpt = repository.findCuaHang();
        
        ThongTinCuaHang cuaHang;
        if (cuaHangOpt.isPresent()) {
            cuaHang = cuaHangOpt.get();
        } else {
            cuaHang = new ThongTinCuaHang();
        }
        
       
        if (cuaHangMoi.getTen() == null || cuaHangMoi.getTen().trim().isEmpty()) {
            throw new IllegalArgumentException("Tên cửa hàng không được để trống");
        }
        if (cuaHangMoi.getDiaChi() == null || cuaHangMoi.getDiaChi().trim().isEmpty()) {
            throw new IllegalArgumentException("Địa chỉ không được để trống");
        }
        if (cuaHangMoi.getSoDienThoai() == null || cuaHangMoi.getSoDienThoai().trim().isEmpty()) {
            throw new IllegalArgumentException("Số điện thoại không được để trống");
        }
        if (cuaHangMoi.getGioMoCua() == null || cuaHangMoi.getGioDongCua() == null) {
            throw new IllegalArgumentException("Giờ mở cửa và đóng cửa không được để trống");
        }
        if (cuaHangMoi.getGioMoCua().isAfter(cuaHangMoi.getGioDongCua())) {
            throw new IllegalArgumentException("Giờ mở cửa phải trước giờ đóng cửa");
        }
        
      
        cuaHang.setTen(cuaHangMoi.getTen());
        cuaHang.setDiaChi(cuaHangMoi.getDiaChi());
        cuaHang.setSoDienThoai(cuaHangMoi.getSoDienThoai());
        cuaHang.setGioMoCua(cuaHangMoi.getGioMoCua());
        cuaHang.setGioDongCua(cuaHangMoi.getGioDongCua());
        
        return repository.save(cuaHang);
    }
    
 
    public boolean isCuaHangMo() {
        LocalTime currentTime = getCurrentTimeInVietnam();
        return repository.isCuaHangMo(currentTime);
    }
  
    public String getTrangThaiCuaHang() {
        Optional<ThongTinCuaHang> cuaHangOpt = getCuaHang();
        if (cuaHangOpt.isEmpty()) {
            return "Chưa có thông tin cửa hàng";
        }
        
        return cuaHangOpt.get().getTrangThaiInfo();
    }
    
  
    public ThongTinCuaHang getCuaHangStatus() {
        Optional<ThongTinCuaHang> cuaHangOpt = getCuaHang();
        
        if (cuaHangOpt.isEmpty()) {
            ThongTinCuaHang emptyCuaHang = new ThongTinCuaHang();
            emptyCuaHang.setTen("Chưa có thông tin cửa hàng");
            return emptyCuaHang;
        }
        
        return cuaHangOpt.get();
    }
    
   
    public Optional<ThongTinCuaHang> getCuaHangStatusOptional() {
        return getCuaHang();
    }
}