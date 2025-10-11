package com.ths.onlinefood.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "mon_an")
public class MonAn {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String tenMonAn;

    private String moTa;

    private double gia;

    private int trangThai;

    @ManyToOne
    @JoinColumn(name = "id_danh_muc")
    private DanhMuc danhMuc;

    @OneToMany(mappedBy = "monAn", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonManagedReference
    private List<HinhAnhMonAn> hinhAnhMonAns;
    
    @OneToOne(mappedBy = "monAn", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonManagedReference
    private KhuyenMai khuyenMai;
    
   @OneToMany(mappedBy = "monAn")
    @JsonIgnore
    private List<GioHang> gioHangList;


}
