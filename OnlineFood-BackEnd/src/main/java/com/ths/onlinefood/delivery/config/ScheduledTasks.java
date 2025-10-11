/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.ths.onlinefood.delivery.config;

import com.ths.onlinefood.delivery.service.DeliveryTrackingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ScheduledTasks {
    
    private final DeliveryTrackingService trackingService;
    
    /**
     * Xóa dữ liệu tracking cũ mỗi ngày lúc 2 giờ sáng
     */
    @Scheduled(cron = "0 0 2 * * *")
    public void cleanOldTrackingData() {
        log.info("Bắt đầu dọn dẹp dữ liệu tracking cũ");
        try {
            trackingService.cleanOldTrackingData(
                DeliveryConfig.TRACKING_DATA_RETENTION_DAYS
            );
            log.info("Hoàn tất dọn dẹp dữ liệu tracking cũ");
        } catch (Exception e) {
            log.error("Lỗi khi dọn dẹp dữ liệu tracking: ", e);
        }
    }
}