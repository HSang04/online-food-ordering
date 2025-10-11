package com.ths.onlinefood.service;

import com.ths.onlinefood.dto.MonAnDTO;
import com.ths.onlinefood.model.KhuyenMai;
import com.ths.onlinefood.model.MonAn;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class MonAnDTOConverter {
    
    public MonAnDTO convertToDTO(MonAn monAn) {
        MonAnDTO dto = new MonAnDTO();
        
        
        dto.setId(monAn.getId());
        dto.setTenMonAn(monAn.getTenMonAn());
        dto.setGia(monAn.getGia());
        dto.setMoTa(monAn.getMoTa());
        dto.setTrangThai(monAn.getTrangThai());
        dto.setDanhMuc(monAn.getDanhMuc());
        dto.setHinhAnhMonAns(monAn.getHinhAnhMonAns());
        
      
        boolean coKhuyenMai = isValidPromotion(monAn);
        dto.setCoKhuyenMai(coKhuyenMai);
        
        if (coKhuyenMai) {
            double giaKhuyenMai = monAn.getKhuyenMai().getGiaGiam();
            dto.setGiaKhuyenMai(giaKhuyenMai);
            dto.setPhanTramGiamGia(calculateDiscountPercentage(monAn.getGia(), giaKhuyenMai));
        } else {
            dto.setGiaKhuyenMai(monAn.getGia());
            dto.setPhanTramGiamGia(0);
        }
        
        return dto;
    }
    
  
    private boolean isValidPromotion(MonAn monAn) {
        KhuyenMai khuyenMai = monAn.getKhuyenMai();
        
        if (khuyenMai == null) {
            return false;
        }
        
      
        if (khuyenMai.getGiaGiam() <= 0 || khuyenMai.getGiaGiam() >= monAn.getGia()) {
            return false;
        }
        
     
        if (khuyenMai.getThoiHan() != null && 
            khuyenMai.getThoiHan().isBefore(LocalDateTime.now())) {
            return false;
        }
        
        return true;
    }
    
 
    private int calculateDiscountPercentage(double giaGoc, double giaKhuyenMai) {
        if (giaGoc <= 0) return 0;
        return (int) Math.round(((giaGoc - giaKhuyenMai) / giaGoc) * 100);
    }
    
   
    public double getDisplayPrice(MonAn monAn) {
        return isValidPromotion(monAn) ? 
            monAn.getKhuyenMai().getGiaGiam() : monAn.getGia();
    }
    
  
    public double getSavingAmount(MonAn monAn) {
        if (!isValidPromotion(monAn)) return 0;
        return monAn.getGia() - monAn.getKhuyenMai().getGiaGiam();
    }
}