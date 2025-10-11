package com.ths.onlinefood.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "don_hang")
public class DonHang {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDateTime ngayTao;

   @Enumerated(EnumType.STRING)
    private TrangThaiDonHang_ENUM trangThai;

    private Double tongTien;

    @ManyToOne
    @JoinColumn(name = "id_nguoi_dung")
    private NguoiDung nguoiDung;

    @ManyToOne
    @JoinColumn(name = "id_voucher")
    private Voucher voucher;
    
    private String diaChiGiaoHang;
    
     private String ghiChu;
     
     @OneToOne(mappedBy = "donHang", fetch = FetchType.LAZY)
    @JsonIgnoreProperties({"donHang", "hibernateLazyInitializer"})
    private HoaDon hoaDon;

    @OneToMany(mappedBy = "donHang", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnoreProperties({"donHang", "hibernateLazyInitializer"})
    private List<ChiTietDonHang> chiTietDonHang;
    }
