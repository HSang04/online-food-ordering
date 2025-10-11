package com.ths.onlinefood.model;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "hoa_don")
public class HoaDon {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_don_hang", unique = true)
    @JsonIgnoreProperties({"hoaDon", "hibernateLazyInitializer"})
    private DonHang donHang;

    @Column(name = "ho_ten", nullable = false)
    private String hoTen;
    
    @Column(name = "dia_chi", nullable = false, length = 500)
    private String diaChi;
    
    @Column(name = "so_dien_thoai", nullable = false, length = 15)
    private String soDienThoai;
    
    @Column(name = "tong_tien", nullable = false)
    private Double tongTien;
    
    @Column(name = "phuong_thuc", nullable = false)
    private String phuongThuc; // COD, VNPAY
    
    @Column(name = "thoi_gian_thanh_toan", nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date thoiGianThanhToan;
    
    @Column(name = "trang_thai", nullable = false)
    private String trangThai; // DA_THANH_TOAN, CHUA_THANH_TOAN, HUY
    
    @Column(name = "ma_gd", unique = true)
    private String maGD; // Mã giao dịch VNPay hoặc COD
    
    // Constructor cho việc tạo hóa đơn nhanh (không bao gồm id vì sẽ được generate)
    public HoaDon(DonHang donHang, String hoTen, String diaChi, String soDienThoai, 
                  Double tongTien, String phuongThuc, String trangThai, String maGD) {
        this.donHang = donHang;
        this.hoTen = hoTen;
        this.diaChi = diaChi;
        this.soDienThoai = soDienThoai;
        this.tongTien = tongTien;
        this.phuongThuc = phuongThuc;
        this.thoiGianThanhToan = new Date();
        this.trangThai = trangThai;
        this.maGD = maGD;
    }
}