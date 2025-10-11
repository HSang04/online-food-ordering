/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.ths.onlinefood.delivery.model;

public enum DeliveryStatus {
    WAITING,        // Đang chờ lấy hàng
    PICKING_UP,     // Đang đến lấy hàng
    PICKED_UP,      // Đã lấy hàng
    DELIVERING,     // Đang giao hàng
    NEAR_CUSTOMER,  // Gần đến khách (< 500m)
    DELIVERED,      // Đã giao thành công
    FAILED,         // Giao thất bại
    RETURNING       // Đang quay về cửa hàng
}