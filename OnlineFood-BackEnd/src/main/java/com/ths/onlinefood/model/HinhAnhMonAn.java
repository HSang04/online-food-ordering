package com.ths.onlinefood.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "hinh_anh_mon_an")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class HinhAnhMonAn {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "duong_dan", nullable = false, columnDefinition = "TEXT")
    private String duongDan;

   @ManyToOne
    @JoinColumn(name = "id_mon_an")
    @JsonBackReference
    private MonAn monAn;
}
