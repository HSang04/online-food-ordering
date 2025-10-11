package com.ths.onlinefood.controller;

import com.ths.onlinefood.request.ApiResponseRequest;
import com.ths.onlinefood.request.PasswordVerificationRequest;
import com.ths.onlinefood.dto.NguoiDungDTO;
import com.ths.onlinefood.model.NguoiDung;
import com.ths.onlinefood.request.ChangePasswordRequest;
import com.ths.onlinefood.service.NguoiDungService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/nguoi-dung")
@RequiredArgsConstructor
public class NguoiDungController {
    
    private final NguoiDungService nguoiDungService;

    @GetMapping
    public ResponseEntity<List<NguoiDung>> getAll() {
        return ResponseEntity.ok(nguoiDungService.getAll());
    }
    
    @GetMapping("/vo-hieu-hoa")
    public ResponseEntity<List<NguoiDung>> getVoHieuHoa() {
        return ResponseEntity.ok(nguoiDungService.findByTrangThaiFalse());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<NguoiDung> getById(@PathVariable Long id) {
        return nguoiDungService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<NguoiDung> update(@PathVariable Long id, @RequestBody NguoiDung nguoiDung) {
        try {
            NguoiDung updatedUser = nguoiDungService.adminUpdate(id, nguoiDung);
            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
  
    @GetMapping("/secure/{id}")
    public ResponseEntity<NguoiDung> getSecureById(@PathVariable Long id, Principal principal) {
        String currentUsername = principal.getName();
        System.out.println("Current user: " + currentUsername);
        
        return nguoiDungService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PutMapping("/secure/{id}")
    public ResponseEntity<NguoiDungDTO> updateProfile(
            @PathVariable Long id, 
            @RequestBody NguoiDungDTO updateRequest,
            Principal principal) {
        
        try {
            String currentUsername = principal.getName();
            NguoiDungDTO updatedUser = nguoiDungService.updateProfile(id, updateRequest, currentUsername);
            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PutMapping("/secure/{id}/change-password")
    public ResponseEntity<ApiResponseRequest> changePassword(
            @PathVariable Long id,
            @RequestBody ChangePasswordRequest request,
            Principal principal) {
        
        try {
            String currentUsername = principal.getName();
            nguoiDungService.changePassword(id, request, currentUsername);
            
            return ResponseEntity.ok(new ApiResponseRequest(true, "Đổi mật khẩu thành công"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponseRequest(false, e.getMessage()));
        }
    }

    // Vô hiệu hóa tài khoản với xác thực mật khẩu (user tự thực hiện)
    @PatchMapping("/secure/{id}/deactivate")
    public ResponseEntity<ApiResponseRequest> deactivateAccountWithPassword(
            @PathVariable Long id,
            @RequestBody PasswordVerificationRequest request,
            Principal principal) {
        
        try {
            String currentUsername = principal.getName();
            nguoiDungService.deactivateAccountWithPassword(id, request, currentUsername);
            
            return ResponseEntity.ok(new ApiResponseRequest(true, "Vô hiệu hóa tài khoản thành công"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponseRequest(false, e.getMessage()));
        }
    }

    // Xóa tài khoản với xác thực mật khẩu (user tự thực hiện)
    @DeleteMapping("/secure/{id}")
    public ResponseEntity<ApiResponseRequest> deleteAccountWithPassword(
            @PathVariable Long id,
            @RequestBody PasswordVerificationRequest request,
            Principal principal) {
        
        try {
            String currentUsername = principal.getName();
            nguoiDungService.deleteAccountWithPassword(id, request, currentUsername);
            
            return ResponseEntity.ok(new ApiResponseRequest(true, "Xóa tài khoản thành công"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponseRequest(false, e.getMessage()));
        }
    }
    
    @GetMapping("/secure/profile")
    public ResponseEntity<NguoiDung> getCurrentUserProfile(Principal principal) {
        String currentUsername = principal.getName();
        
        return nguoiDungService.getByUsername(currentUsername)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    // Admin endpoints (không cần xác thực mật khẩu)
    @PatchMapping("/{id}/vo-hieu-hoa")
    public ResponseEntity<?> voHieuHoaNguoiDung(@PathVariable Long id) {
        try {
            nguoiDungService.voHieuHoaNguoiDung(id);
            return ResponseEntity.ok("Đã vô hiệu hóa người dùng");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @PatchMapping("/{id}/kich-hoat")
    public ResponseEntity<?> kichHoatNguoiDung(@PathVariable Long id) {
        try {
            nguoiDungService.kichHoatNguoiDung(id);
            return ResponseEntity.ok("Đã kích hoạt người dùng");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    // Admin xóa người dùng (soft delete)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> xoaNguoiDung(@PathVariable Long id) {
        try {
            nguoiDungService.xoaNguoiDung(id);
            return ResponseEntity.ok("Đã xóa người dùng thành công");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}