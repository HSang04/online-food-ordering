package com.ths.onlinefood.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GioHangThongKeDTO {
    private double tongTien;
    private double tongTietKiem;
    private int soLuongMonAn;
    private int tongSoLuong;
}