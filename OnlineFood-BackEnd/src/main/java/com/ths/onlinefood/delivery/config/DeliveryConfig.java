/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.ths.onlinefood.delivery.config;


import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

@Configuration
@EnableScheduling
public class DeliveryConfig {
    
    // Cấu hình cho delivery service
    public static final Double MAX_DELIVERY_DISTANCE = 20.0; // km
    public static final Double FREE_SHIPPING_THRESHOLD = 200000.0; // VNĐ
    public static final Double SHIPPING_FEE = 30000.0; // VNĐ
    public static final Double AVERAGE_SPEED = 25.0; // km/h
    public static final Integer TRACKING_UPDATE_INTERVAL = 5000; // ms
    public static final Integer TRACKING_DATA_RETENTION_DAYS = 30; // days
    
    // Cấu hình cho đồ thị
    public static final Double NEARBY_NODE_RADIUS = 5.0; // km
    public static final Integer MAX_PATH_NODES = 50;
}
