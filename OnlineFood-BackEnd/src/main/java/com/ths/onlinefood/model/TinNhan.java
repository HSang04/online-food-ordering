/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.ths.onlinefood.model;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;


@Entity
@Table(name = "tin_nhan")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TinNhan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "hoi_thoai_id")
    private HoiThoai hoiThoai;

    @Column(name = "nguoi_gui_id", nullable = false)
    private Long nguoiGuiId;

    @Enumerated(EnumType.STRING)
    @Column(name = "vai_tro_nguoi_gui", nullable = false)
    private USER_ROLE vaiTroNguoiGui;

    @Column(name = "noi_dung", nullable = false)
    private String noiDung;

    @Column(name = "thoi_gian_tao", updatable = false)
     private LocalDateTime thoiGianTao = LocalDateTime.now();
}

