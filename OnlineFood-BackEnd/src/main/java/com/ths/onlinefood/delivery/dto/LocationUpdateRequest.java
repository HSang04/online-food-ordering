/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.ths.onlinefood.delivery.dto;


import com.ths.onlinefood.delivery.model.DeliveryStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class LocationUpdateRequest {
    
    @NotNull(message = "ID đơn hàng không được để trống")
    private Long donHangId;
    
    @NotNull(message = "Vĩ độ không được để trống")
    @Min(value = -90, message = "Vĩ độ phải từ -90 đến 90")
    @Max(value = 90, message = "Vĩ độ phải từ -90 đến 90")
    private Double latitude;
    
    @NotNull(message = "Kinh độ không được để trống")
    @Min(value = -180, message = "Kinh độ phải từ -180 đến 180")
    @Max(value = 180, message = "Kinh độ phải từ -180 đến 180")
    private Double longitude;
    
    @Min(value = 0, message = "Tốc độ không được âm")
    private Double speed;
    
    @Min(value = 0, message = "Hướng phải từ 0 đến 360")
    @Max(value = 360, message = "Hướng phải từ 0 đến 360")
    private Double heading;
    
    @NotNull(message = "Trạng thái không được để trống")
    private DeliveryStatus status;
    
    private Double accuracy;
    
    @Min(value = 0, message = "Mức pin không được âm")
    @Max(value = 100, message = "Mức pin tối đa 100%")
    private Double batteryLevel;
    
    private String note;
}