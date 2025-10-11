
package com.ths.onlinefood.response;


import com.ths.onlinefood.model.HoiThoai;
import com.ths.onlinefood.model.NguoiDung;
import com.ths.onlinefood.model.TinNhan;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ChatAdminResponseDTO {
    private HoiThoai hoiThoai;
    private List<TinNhan> tinNhanList;
    private NguoiDung khachHang;
}