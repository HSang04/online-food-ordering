/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.ths.onlinefood.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;

@Entity
@Table(name = "thong_tin_cua_hang")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ThongTinCuaHang {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "ten", nullable = false)
    private String ten;
    
    @Column(name = "dia_chi", nullable = false, columnDefinition = "TEXT")
    private String diaChi;
    
    @Column(name = "so_dien_thoai", nullable = false, length = 20)
    private String soDienThoai;
    
    @Column(name = "gio_mo_cua", nullable = false)
    @JsonFormat(pattern = "HH:mm:ss")
    private LocalTime gioMoCua;
    
    @Column(name = "gio_dong_cua", nullable = false)
    @JsonFormat(pattern = "HH:mm:ss")
    private LocalTime gioDongCua;
    
    @Column(name = "ngay_tao")
    @JsonIgnore 
    private LocalDateTime ngayTao;
    
    @Column(name = "ngay_cap_nhat")
    @JsonIgnore  
    private LocalDateTime ngayCapNhat;
    
     @Column(name = "vi_do")
    private Double viDo;

    @Column(name = "kinh_do")
    private Double kinhDo;
    
 
    private static final ZoneId VIETNAM_TIMEZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    
    @PrePersist
    protected void onCreate() {
        ngayTao = LocalDateTime.now();
        ngayCapNhat = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        ngayCapNhat = LocalDateTime.now();
    }
    
   
    @JsonIgnore
    private LocalTime getCurrentTimeInVietnam() {
        return ZonedDateTime.now(VIETNAM_TIMEZONE).toLocalTime();
    }
    
   
    @JsonProperty("isOpen")  // Đảm bảo JSON key là "isOpen"
    public boolean isOpen() {
        if (gioMoCua == null || gioDongCua == null) {
            return false;
        }
        LocalTime hienTai = getCurrentTimeInVietnam();
        return !hienTai.isBefore(gioMoCua) && !hienTai.isAfter(gioDongCua);
    }
    
  
    @JsonIgnore  // Tránh duplicate key trong JSON
    public boolean getIsOpen() {
        return isOpen();
    }
    
  
    @JsonIgnore
    public String getGioMoCuaFormatted() {
        return gioMoCua != null ? gioMoCua.toString().substring(0, 5) : "";
    }
    
 
    @JsonIgnore
    public String getGioDongCuaFormatted() {
        return gioDongCua != null ? gioDongCua.toString().substring(0, 5) : "";
    }
    
 
    @JsonProperty("thongTin")
    public String getTrangThaiInfo() {
        if (gioMoCua == null || gioDongCua == null) {
            return "Chưa có thông tin giờ hoạt động";
        }
        
        if (isOpen()) {
            return "Đang mở cửa - Đóng cửa lúc " + getGioDongCuaFormatted();
        } else {
            return "Đã đóng cửa - Mở cửa từ " + getGioMoCuaFormatted() + " đến " + getGioDongCuaFormatted();
        }
    }
    
   
    @JsonProperty("gioMoCua")
    public String getGioMoCuaString() {
        return getGioMoCuaFormatted();
    }
    
   
    @JsonProperty("gioDongCua") 
    public String getGioDongCuaString() {
        return getGioDongCuaFormatted();
    }
}