package com.ths.onlinefood.dto;

import com.ths.onlinefood.model.USER_ROLE;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class NguoiDungDTO {
    private Long id;
    private String username;
    private String matKhau;
    private String hoTen;
    private String email;
    private String soDienThoai;
    private String diaChi;
    private USER_ROLE vaiTro;
}

