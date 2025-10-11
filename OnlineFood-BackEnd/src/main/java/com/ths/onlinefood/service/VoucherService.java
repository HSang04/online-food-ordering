package com.ths.onlinefood.service;

import com.ths.onlinefood.model.Voucher;
import com.ths.onlinefood.repository.VoucherRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.HashMap;

@Service
public class VoucherService {
    
    private static final Logger logger = LoggerFactory.getLogger(VoucherService.class);
    
    @Autowired
    private VoucherRepository voucherRepository;

    /**
     * Chỉ kiểm tra và cập nhật voucher hết hạn khi admin getAll
     */
    public void checkAndUpdateExpiredVouchersForAdmin() {
        try {
            List<Voucher> activeVouchers = voucherRepository.findByTrangThai(true);
            LocalDate today = LocalDate.now();
            boolean hasChanges = false;
            
            for (Voucher voucher : activeVouchers) {
                if (voucher == null || voucher.getHanSuDung() == null) continue;
                
                LocalDate expireDate = getExpireDate(voucher.getHanSuDung());
                if (expireDate == null) continue;
                
                // Kiểm tra hết hạn
                if (expireDate.isBefore(today)) {
                    voucher.setTrangThai(false);
                    hasChanges = true;
                    logger.info("Voucher {} đã hết hạn, cập nhật trạng thái", voucher.getMaVoucher());
                }
                
                // Kiểm tra hết số lượng
                if (voucher.getDaSuDung() >= voucher.getSoLuong()) {
                    voucher.setTrangThai(false);
                    hasChanges = true;
                    logger.info("Voucher {} đã hết số lượng, cập nhật trạng thái", voucher.getMaVoucher());
                }
            }
            
            if (hasChanges) {
                voucherRepository.saveAll(activeVouchers);
                logger.info("Đã cập nhật trạng thái các voucher hết hạn/hết số lượng");
            }
            
        } catch (Exception e) {
            logger.error("Lỗi khi kiểm tra voucher hết hạn: {}", e.getMessage());
        }
    }
    
    private LocalDate getExpireDate(Object hanSuDung) {
        try {
            if (hanSuDung instanceof java.time.LocalDate localDate) {
                return localDate;
            } else if (hanSuDung instanceof java.time.LocalDateTime localDateTime) {
                return localDateTime.toLocalDate();
            } else if (hanSuDung instanceof java.util.Date date) {
                return date.toInstant()
                    .atZone(java.time.ZoneId.systemDefault())
                    .toLocalDate();
            } else if (hanSuDung instanceof java.sql.Date date) {
                return date.toLocalDate();
            }
        } catch (Exception e) {
            logger.warn("Lỗi khi chuyển đổi ngày hết hạn: {}", e.getMessage());
        }
        return null;
    }

    public List<Voucher> getAllVouchers() {
        // Chỉ kiểm tra khi admin gọi
        checkAndUpdateExpiredVouchersForAdmin();
        return voucherRepository.findAll();
    }

    public Voucher getVoucherById(Long id) {
        return voucherRepository.findById(id).orElse(null);
    }

    /**
     * Kiểm tra mã voucher có trùng lặp không
     */
    private boolean isDuplicateVoucherCode(String maVoucher, Long excludeId) {
        Optional<Voucher> existingVoucher = voucherRepository.findByMaVoucher(maVoucher);
        if (existingVoucher.isEmpty()) {
            return false; // Không trùng
        }
        
        // Nếu đang sửa voucher, bỏ qua chính voucher đó
        if (excludeId != null && existingVoucher.get().getId().equals(excludeId)) {
            return false;
        }
        
        return true; // Trùng với voucher khác
    }

    public Voucher createVoucher(Voucher voucher) {
        // Kiểm tra mã voucher trùng lặp
        if (isDuplicateVoucherCode(voucher.getMaVoucher(), null)) {
            logger.warn("Mã voucher {} đã tồn tại", voucher.getMaVoucher());
            throw new IllegalArgumentException("Mã voucher '" + voucher.getMaVoucher() + "' đã tồn tại trong hệ thống");
        }
        
        logger.info("Tạo voucher mới với mã: {}", voucher.getMaVoucher());
        return voucherRepository.save(voucher);
    }

    public Voucher updateVoucher(Long id, Voucher updatedVoucher) {
        Optional<Voucher> existing = voucherRepository.findById(id);
        if (existing.isEmpty()) {
            logger.warn("Không tìm thấy voucher với id: {}", id);
            throw new IllegalArgumentException("Không tìm thấy voucher với id: " + id);
        }

        // Kiểm tra mã voucher trùng lặp (loại trừ chính voucher đang sửa)
        if (isDuplicateVoucherCode(updatedVoucher.getMaVoucher(), id)) {
            logger.warn("Mã voucher {} đã tồn tại khi cập nhật voucher id: {}", updatedVoucher.getMaVoucher(), id);
            throw new IllegalArgumentException("Mã voucher '" + updatedVoucher.getMaVoucher() + "' đã tồn tại trong hệ thống");
        }

        Voucher v = existing.get();
        v.setMaVoucher(updatedVoucher.getMaVoucher());
        v.setLoai(updatedVoucher.getLoai());
        v.setGiaTri(updatedVoucher.getGiaTri());
        v.setHanSuDung(updatedVoucher.getHanSuDung());
        v.setSoLuong(updatedVoucher.getSoLuong());
        v.setMoTa(updatedVoucher.getMoTa());
        v.setDaSuDung(updatedVoucher.getDaSuDung());
        v.setTrangThai(updatedVoucher.getTrangThai());
        v.setGiaToiThieu(updatedVoucher.getGiaToiThieu());
        
        logger.info("Cập nhật voucher id: {} với mã: {}", id, updatedVoucher.getMaVoucher());
        return voucherRepository.save(v);
    }

    public void deleteVoucher(Long id) {
        if (!voucherRepository.existsById(id)) {
            throw new IllegalArgumentException("Không tìm thấy voucher với id: " + id);
        }
        logger.info("Xóa voucher id: {}", id);
        voucherRepository.deleteById(id);
    }

    public Optional<Voucher> findByMaVoucher(String maVoucher) {
        return voucherRepository.findByMaVoucher(maVoucher);
    }
    
    public List<Voucher> getVoucherTrue() {
        return voucherRepository.findByTrangThai(true);
    }
    
    /**
     * Kiểm tra voucher khi người dùng tạo đơn hàng
     * Chỉ kiểm tra voucher cụ thể, không cập nhật toàn bộ
     */
    public Map<String, Object> validateVoucherForOrder(String maVoucher, double tongTien) {
        Map<String, Object> result = new HashMap<>();
        
        // 1. Tìm voucher
        Optional<Voucher> optionalVoucher = voucherRepository.findByMaVoucher(maVoucher);
        if (optionalVoucher.isEmpty()) {
            logger.warn("Voucher {} không tồn tại", maVoucher);
            result.put("valid", false);
            result.put("message", "Mã voucher không tồn tại");
            result.put("errorCode", "VOUCHER_NOT_FOUND");
            return result;
        }

        Voucher voucher = optionalVoucher.get();
        result.put("voucher", voucher);

        // 2. Kiểm tra trạng thái
        if (voucher.getTrangThai() == null || !voucher.getTrangThai()) {
            logger.warn("Voucher {} không khả dụng", maVoucher);
            result.put("valid", false);
            result.put("message", "Voucher không khả dụng");
            result.put("errorCode", "VOUCHER_INACTIVE");
            return result;
        }

        // 3. Kiểm tra hạn sử dụng
        LocalDate expireDate = getExpireDate(voucher.getHanSuDung());
        if (expireDate != null && expireDate.isBefore(LocalDate.now())) {
            logger.warn("Voucher {} đã hết hạn", maVoucher);
            result.put("valid", false);
            result.put("message", "Voucher đã hết hạn sử dụng");
            result.put("errorCode", "VOUCHER_EXPIRED");
            return result;
        }

        // 4. Kiểm tra số lượng còn lại
        if (voucher.getDaSuDung() >= voucher.getSoLuong()) {
            logger.warn("Voucher {} đã hết lượt sử dụng", maVoucher);
            result.put("valid", false);
            result.put("message", "Voucher đã hết lượt sử dụng");
            result.put("errorCode", "VOUCHER_OUT_OF_STOCK");
            return result;
        }

        // 5. Kiểm tra điều kiện tối thiểu
        if (tongTien < voucher.getGiaToiThieu()) {
            logger.warn("Đơn hàng không đạt giá tối thiểu để áp dụng voucher {}", maVoucher);
            result.put("valid", false);
            result.put("message", String.format("Đơn hàng phải từ %,.0f₫ trở lên để sử dụng voucher này", voucher.getGiaToiThieu()));
            result.put("errorCode", "MINIMUM_AMOUNT_NOT_REACHED");
            return result;
        }

        // 6. Tính số tiền giảm
        double discount = calculateDiscount(voucher, tongTien);
        double finalAmount = tongTien - discount;

        result.put("discountAmount", discount);
        result.put("finalAmount", finalAmount);
        result.put("originalAmount", tongTien);
        result.put("valid", true);
        result.put("message", "Voucher hợp lệ và có thể sử dụng");
        
        logger.info("Voucher {} hợp lệ cho đơn hàng {}", maVoucher, tongTien);
        return result;
    }

   
    public Map<String, Object> findAndValidateVoucher(String maVoucher, double tongTien) {
        return validateVoucherForOrder(maVoucher, tongTien);
    }
   
    private double calculateDiscount(Voucher voucher, double tongTien) {
        double discount = 0.0;
        
        if (voucher.getLoai() == Voucher.LoaiVoucher.PHAN_TRAM) {
            discount = tongTien * (voucher.getGiaTri() / 100.0);
        } else if (voucher.getLoai() == Voucher.LoaiVoucher.TIEN_MAT) {
            discount = voucher.getGiaTri();
        }

        // Đảm bảo không giảm quá số tiền đơn hàng
        return Math.min(discount, tongTien);
    }

  
    public boolean useVoucher(String maVoucher) {
        try {
            Optional<Voucher> optionalVoucher = voucherRepository.findByMaVoucher(maVoucher);
            if (optionalVoucher.isEmpty()) {
                logger.warn("Voucher {} không tồn tại khi sử dụng", maVoucher);
                return false;
            }

            Voucher voucher = optionalVoucher.get();
            voucher.setDaSuDung(voucher.getDaSuDung() + 1);
            voucherRepository.save(voucher);

            logger.info("Đã sử dụng voucher {}, số lần đã dùng: {}/{}", 
                maVoucher, voucher.getDaSuDung(), voucher.getSoLuong());
            return true;
            
        } catch (Exception e) {
            logger.error("Lỗi khi sử dụng voucher {}: {}", maVoucher, e.getMessage());
            return false;
        }
    }
}