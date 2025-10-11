package com.ths.onlinefood.dto;

import com.ths.onlinefood.model.DanhMuc;
import com.ths.onlinefood.model.HinhAnhMonAn;
import lombok.Data;
import java.util.List;

@Data
public class MonAnDTO {
    private Long id;
    private String tenMonAn;
    private double gia; // Giá gốc
    private String moTa;
    private int trangThai;
    private DanhMuc danhMuc;
    private List<Long> keptImageIds;
    

    private List<HinhAnhMonAn> hinhAnhMonAns;
    
 
    private double giaKhuyenMai; 
    private boolean coKhuyenMai; 
    private int phanTramGiamGia;
    private int soLuongDaBan = 0;
    
 
    public double getGiaHienThi() {
        return coKhuyenMai ? giaKhuyenMai : gia;
    }
    
   
    public double getSoTienTietKiem() {
        return coKhuyenMai ? (gia - giaKhuyenMai) : 0;
    }
    
    public int getSoLuongDaBan() {
        return soLuongDaBan;
    }

    public void setSoLuongDaBan(int soLuongDaBan) {
        this.soLuongDaBan = soLuongDaBan;
    }
}