//package com.ths.onlinefood.scheduler;
//
//import com.ths.onlinefood.service.VoucherService;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.scheduling.annotation.Scheduled;
//import org.springframework.stereotype.Component;
//import org.slf4j.Logger;
//import org.slf4j.LoggerFactory;
//
//@Component
//public class VoucherScheduler {
//    
//    private static final Logger logger = LoggerFactory.getLogger(VoucherScheduler.class);
//    
//    @Autowired
//    private VoucherService voucherService;
//    
//   
//    @Scheduled(cron = "0 0 0 * * *")
//    public void scheduledUpdateExpiredVouchers() {
//        try {
//            logger.info("Bắt đầu kiểm tra và cập nhật trạng thái voucher hết hạn...");
//            voucherService.checkAndUpdateAllExpiredVouchers();
//            logger.info("Hoàn thành kiểm tra và cập nhật trạng thái voucher hết hạn");
//        } catch (Exception e) {
//            logger.error("Lỗi khi cập nhật trạng thái voucher hết hạn: ", e);
//        }
//    }
//    
// 
//    @Scheduled(fixedRate = 21600000) 
//    public void scheduledUpdateSoldOutVouchers() {
//        try {
//            logger.info("Kiểm tra voucher hết lượt sử dụng...");
//            voucherService.checkAndUpdateAllExpiredVouchers();
//        } catch (Exception e) {
//            logger.error("Lỗi khi kiểm tra voucher hết lượt: ", e);
//        }
//    }
//}