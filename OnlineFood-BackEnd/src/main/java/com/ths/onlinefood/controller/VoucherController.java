package com.ths.onlinefood.controller;

import com.ths.onlinefood.model.Voucher;
import com.ths.onlinefood.service.VoucherService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/vouchers")
public class VoucherController {
    
    @Autowired
    private VoucherService voucherService;
    
    @GetMapping
    public List<Voucher> getAllVouchers() {
        return voucherService.getAllVouchers();
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Object> getVoucherById(@PathVariable Long id) {
        try {
            Voucher voucher = voucherService.getVoucherById(id);
            if (voucher == null) {
                Map<String, Object> error = new HashMap<>();
                error.put("error", "Không tìm thấy voucher");
                error.put("message", "Voucher với id " + id + " không tồn tại");
                return ResponseEntity.badRequest().body(error);
            }
            return ResponseEntity.ok(voucher);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Lỗi hệ thống");
            error.put("message", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }
    
    @PostMapping
    public ResponseEntity<Object> createVoucher(@RequestBody Voucher voucher) {
        try {
            Voucher createdVoucher = voucherService.createVoucher(voucher);
            return ResponseEntity.ok(createdVoucher);
        } catch (IllegalArgumentException e) {
           
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Dữ liệu không hợp lệ");
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
       
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Lỗi hệ thống");
            error.put("message", "Không thể tạo voucher. Vui lòng thử lại.");
            return ResponseEntity.internalServerError().body(error);
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Object> updateVoucher(@PathVariable Long id, @RequestBody Voucher voucher) {
        try {
            Voucher updatedVoucher = voucherService.updateVoucher(id, voucher);
            return ResponseEntity.ok(updatedVoucher);
        } catch (IllegalArgumentException e) {
      
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Dữ liệu không hợp lệ");
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
          
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Lỗi hệ thống");
            error.put("message", "Không thể cập nhật voucher. Vui lòng thử lại.");
            return ResponseEntity.internalServerError().body(error);
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Object> deleteVoucher(@PathVariable Long id) {
        try {
            voucherService.deleteVoucher(id);
            Map<String, Object> success = new HashMap<>();
            success.put("success", true);
            success.put("message", "Xóa voucher thành công");
            return ResponseEntity.ok(success);
        } catch (IllegalArgumentException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Không tìm thấy voucher");
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Lỗi hệ thống");
            error.put("message", "Không thể xóa voucher. Vui lòng thử lại.");
            return ResponseEntity.internalServerError().body(error);
        }
    }
    
    @GetMapping("/find")
    public ResponseEntity<Map<String, Object>> getVoucherByCode(
            @RequestParam String ma,
            @RequestParam(required = false, defaultValue = "0") double tongTien) {
        
        Map<String, Object> response = voucherService.findAndValidateVoucher(ma, tongTien);
        
        boolean isValid = (boolean) response.get("valid");
        if (isValid) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }
}