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
    @JsonIgnore  // Ẩn khỏi JSON response
    private LocalDateTime ngayTao;
    
    @Column(name = "ngay_cap_nhat")
    @JsonIgnore  // Ẩn khỏi JSON response
    private LocalDateTime ngayCapNhat;
    
    // Timezone cho Việt Nam (GMT+7)
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
    
    /**
     * Lấy thời gian hiện tại theo timezone Việt Nam
     */
    @JsonIgnore
    private LocalTime getCurrentTimeInVietnam() {
        return ZonedDateTime.now(VIETNAM_TIMEZONE).toLocalTime();
    }
    
    /**
     * Kiểm tra cửa hàng có đang mở không (sử dụng timezone Việt Nam)
     * QUAN TRỌNG: Method này sẽ được serialize thành JSON với key "open"
     */
    @JsonProperty("isOpen")  // Đảm bảo JSON key là "isOpen"
    public boolean isOpen() {
        if (gioMoCua == null || gioDongCua == null) {
            return false;
        }
        LocalTime hienTai = getCurrentTimeInVietnam();
        return !hienTai.isBefore(gioMoCua) && !hienTai.isAfter(gioDongCua);
    }
    
    /**
     * Alternative getter để đảm bảo JSON serialization
     */
    @JsonIgnore  // Tránh duplicate key trong JSON
    public boolean getIsOpen() {
        return isOpen();
    }
    
    /**
     * Lấy giờ mở cửa dạng HH:mm
     */
    @JsonIgnore
    public String getGioMoCuaFormatted() {
        return gioMoCua != null ? gioMoCua.toString().substring(0, 5) : "";
    }
    
    /**
     * Lấy giờ đóng cửa dạng HH:mm
     */
    @JsonIgnore
    public String getGioDongCuaFormatted() {
        return gioDongCua != null ? gioDongCua.toString().substring(0, 5) : "";
    }
    
    /**
     * Lấy thông tin trạng thái cửa hàng
     * Method này sẽ được serialize thành JSON với key "thongTin"
     */
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
    
    /**
     * Lấy giờ mở cửa cho JSON response (format HH:mm)
     */
    @JsonProperty("gioMoCua")
    public String getGioMoCuaString() {
        return getGioMoCuaFormatted();
    }
    
    /**
     * Lấy giờ đóng cửa cho JSON response (format HH:mm)
     */
    @JsonProperty("gioDongCua") 
    public String getGioDongCuaString() {
        return getGioDongCuaFormatted();
    }
}