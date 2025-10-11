package com.ths.onlinefood.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "chi_tiet_don_hang")
public class ChiTietDonHang {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_don_hang")
    @JsonIgnoreProperties({"chiTietDonHang", "hoaDon", "hibernateLazyInitializer"})
    private DonHang donHang;

    @ManyToOne
    @JoinColumn(name = "id_mon_an")
    private MonAn monAn;

    private int soLuong;

    private Double donGia;
}
