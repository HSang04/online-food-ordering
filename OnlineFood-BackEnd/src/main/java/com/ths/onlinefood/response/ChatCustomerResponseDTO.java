/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.ths.onlinefood.response;


import com.ths.onlinefood.model.HoiThoai;
import com.ths.onlinefood.model.TinNhan;
import com.ths.onlinefood.model.NguoiDung;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

// DTO cho response của chat khách hàng
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ChatCustomerResponseDTO {
    private HoiThoai hoiThoai;
    private List<TinNhan> tinNhanList;
}

