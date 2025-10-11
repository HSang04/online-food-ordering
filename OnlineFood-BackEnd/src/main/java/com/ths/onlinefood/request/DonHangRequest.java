/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.ths.onlinefood.request;

import lombok.Data;
import java.util.List;

@Data
public class DonHangRequest {
    private Long nguoiDungId;
    private String diaChiGiaoHang;
    private Double tongTien;
    private Double tongTienGoc;
    private Double giamGia;
    private Long voucherId;
    private List<ChiTietDonHangRequest> chiTietDonHang;
    private String ghiChu;
}



