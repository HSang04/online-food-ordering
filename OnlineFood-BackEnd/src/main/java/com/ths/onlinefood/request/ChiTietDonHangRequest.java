package com.ths.onlinefood.request;

import lombok.Data;

@Data
public class ChiTietDonHangRequest {
    private Long monAnId;
    private Integer soLuong;
    private Double gia;
    private Double thanhTien;
}
