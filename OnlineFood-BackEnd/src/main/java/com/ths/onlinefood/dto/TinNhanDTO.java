package com.ths.onlinefood.dto;

import com.ths.onlinefood.model.USER_ROLE;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TinNhanDTO {
    private Long hoiThoaiId;
    private Long nguoiGuiId;
    private USER_ROLE vaiTroNguoiGui; 
    private String noiDung;
    private String thoiGian; 
}
