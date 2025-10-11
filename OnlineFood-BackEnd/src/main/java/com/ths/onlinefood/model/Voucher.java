package com.ths.onlinefood.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "voucher")
public class Voucher {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String maVoucher;

    @Enumerated(EnumType.STRING)
    private LoaiVoucher loai;

    private double giaTri;

    private LocalDate hanSuDung;

    private int soLuong;
    
    private String moTa;

    private int daSuDung; 
    
    private int giaToiThieu;
    
    @Column(name = "trang_thai")
    private Boolean trangThai;
    
    public enum LoaiVoucher {
        PHAN_TRAM,
        TIEN_MAT
    }
}
