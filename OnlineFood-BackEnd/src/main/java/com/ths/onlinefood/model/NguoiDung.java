package com.ths.onlinefood.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
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
@Table(name = "nguoi_dung")
public class NguoiDung {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) //Type.UUID sinh random id k trung lap
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;
   
    private String hoTen;
    
    @Column(unique = true, nullable = false)
    private String email;
    
    private String matKhau;
    private String soDienThoai;
    private String diaChi;

    @Enumerated(EnumType.STRING)
    private USER_ROLE vaiTro;

    private LocalDateTime ngayTao;
    
    @Column(name = "trang_thai")
    private Boolean trangThai = true;
    
   @OneToMany(mappedBy = "nguoiDung", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<GioHang> gioHangList;
}
