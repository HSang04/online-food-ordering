package com.ths.onlinefood.service;

import com.ths.onlinefood.dto.GioHangDTO;
import com.ths.onlinefood.model.GioHang;
import com.ths.onlinefood.model.MonAn;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class GioHangDTOConverter {
    
    private final MonAnService monAnService;

    public GioHangDTO convertToDTO(GioHang gioHang) {
        MonAn monAn = gioHang.getMonAn();
        
      
        if (monAn.getHinhAnhMonAns() != null) {
            monAn.getHinhAnhMonAns().size();
        }
        
     
        double giaHienThi = monAnService.getGiaBan(monAn);
        boolean coKhuyenMai = monAnService.isOnSale(monAn);
        int phanTramGiamGia = monAnService.getPhanTramGiamGia(monAn);
        double soTienGiam = coKhuyenMai ? (monAn.getGia() - giaHienThi) : 0;
        
 
        double thanhTien = giaHienThi * gioHang.getSoLuong();
        double tietKiem = soTienGiam * gioHang.getSoLuong();
        
      
        GioHangDTO.MonAnGioHangDTO monAnDTO = createMonAnGioHangDTO(
            monAn, giaHienThi, coKhuyenMai, phanTramGiamGia, soTienGiam
        );
        
       
        return createGioHangDTO(gioHang, monAnDTO, thanhTien, tietKiem);
    }

    private GioHangDTO.MonAnGioHangDTO createMonAnGioHangDTO(
            MonAn monAn, 
            double giaHienThi, 
            boolean coKhuyenMai, 
            int phanTramGiamGia, 
            double soTienGiam) {
        
        GioHangDTO.MonAnGioHangDTO monAnDTO = new GioHangDTO.MonAnGioHangDTO();
        monAnDTO.setId(monAn.getId());
        monAnDTO.setTenMonAn(monAn.getTenMonAn());
        monAnDTO.setGiaGoc(monAn.getGia());
        monAnDTO.setGiaHienThi(giaHienThi);
        monAnDTO.setMoTa(monAn.getMoTa());
        monAnDTO.setTrangThai(monAn.getTrangThai());
        monAnDTO.setCoKhuyenMai(coKhuyenMai);
        monAnDTO.setPhanTramGiamGia(phanTramGiamGia);
        monAnDTO.setSoTienGiam(soTienGiam);
        
       
        if (monAn.getHinhAnhMonAns() != null && !monAn.getHinhAnhMonAns().isEmpty()) {
            monAnDTO.setHinhAnhUrl(monAn.getHinhAnhMonAns().get(0).getDuongDan());
            monAnDTO.setTatCaHinhAnh(monAn.getHinhAnhMonAns());
        }
        
        return monAnDTO;
    }

    private GioHangDTO createGioHangDTO(
            GioHang gioHang, 
            GioHangDTO.MonAnGioHangDTO monAnDTO, 
            double thanhTien, 
            double tietKiem) {
        
        GioHangDTO dto = new GioHangDTO();
        dto.setId(gioHang.getId());
        dto.setNguoiDungId(gioHang.getNguoiDung().getId());
        dto.setSoLuong(gioHang.getSoLuong());
        dto.setMonAn(monAnDTO);
        dto.setThanhTien(thanhTien);
        dto.setTietKiem(tietKiem);
        
        return dto;
    }
}