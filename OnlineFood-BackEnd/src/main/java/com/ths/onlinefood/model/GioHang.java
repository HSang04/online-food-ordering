package com.ths.onlinefood.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "gio_hang")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class GioHang {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

   @ManyToOne
    @JoinColumn(name = "nguoi_dung_id")
    @JsonIgnore
    private NguoiDung nguoiDung;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mon_an_id", nullable = false)
    private MonAn monAn;

    @Column(nullable = false)
    private Integer soLuong;
    
    
}
