package com.ths.onlinefood.dto;

import com.ths.onlinefood.model.HinhAnhMonAn;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class GioHangDTO {
    private Long id;
    private Long nguoiDungId;
    private Integer soLuong;
    
    
    private MonAnGioHangDTO monAn;
    
   
    private double thanhTien; 
    private double tietKiem; 
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonAnGioHangDTO {
        private Long id;
        private String tenMonAn;
        private double giaGoc; 
        private double giaHienThi;
        private String moTa;
        private int trangThai;
        
        
        private boolean coKhuyenMai;
        private int phanTramGiamGia;
        private double soTienGiam; 
        
        
        private String hinhAnhUrl;
        private List<HinhAnhMonAn> tatCaHinhAnh;
    }
}