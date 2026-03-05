package com.ths.onlinefood.controller;

import com.ths.onlinefood.model.DonHang;
import com.ths.onlinefood.model.NguoiDung;
import com.ths.onlinefood.model.USER_ROLE;
import com.ths.onlinefood.request.DonHangRequest;
import com.ths.onlinefood.request.UpdateTrangThaiRequest;
import com.ths.onlinefood.service.DonHangService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/don-hang")
@RequiredArgsConstructor
public class DonHangController {

    private final DonHangService donHangService;

    // ── Lấy tất cả đơn hàng (ADMIN / QUANLY / NHANVIEN_QUANLYDONHANG) ──
    @GetMapping
    public List<DonHang> getAll() {
        return donHangService.getAll();
    }

    // ── Lấy đơn theo ID — có kiểm tra quyền theo role ──
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        Optional<DonHang> optional = donHangService.getById(id);
        if (optional.isEmpty()) return ResponseEntity.notFound().build();

        DonHang donHang = optional.get();

        // Nếu có JWT thì kiểm tra quyền
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                String jwt = authHeader.substring(7);
                NguoiDung currentUser = donHangService.getUserFromToken(jwt);
                USER_ROLE role = currentUser.getVaiTro();

                // Shipper chỉ được xem đơn mà mình đang giao
                if (role == USER_ROLE.NHANVIEN_GIAOHANG) {
                    boolean isOwner = donHang.getNvGiaoHang() != null
                            && donHang.getNvGiaoHang().getId().equals(currentUser.getId());
                    if (!isOwner) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                .body(Map.of("message", "Bạn không có quyền xem đơn hàng này"));
                    }
                }

                // Khách hàng chỉ được xem đơn của chính mình
                if (role == USER_ROLE.KHACHHANG) {
                    boolean isOwner = donHang.getNguoiDung() != null
                            && donHang.getNguoiDung().getId().equals(currentUser.getId());
                    if (!isOwner) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                .body(Map.of("message", "Bạn không có quyền xem đơn hàng này"));
                    }
                }

                // ADMIN, QUANLY, NHANVIEN_QUANLYDONHANG → xem được tất cả

            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Token không hợp lệ hoặc đã hết hạn"));
            }
        }

        return ResponseEntity.ok(donHang);
    }

    @PostMapping("/dat-hang")
    @Transactional
    public ResponseEntity<DonHang> create(@RequestBody DonHangRequest request) {
        try {
            return ResponseEntity.ok(donHangService.createFromRequest(request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<DonHang> update(@PathVariable Long id, @RequestBody DonHang donHang) {
        DonHang updated = donHangService.update(id, donHang);
        return updated == null ? ResponseEntity.notFound().build() : ResponseEntity.ok(updated);
    }

    @PatchMapping("/trang-thai/{id}")
    public ResponseEntity<DonHang> updateTrangThai(
            @PathVariable Long id,
            @RequestBody UpdateTrangThaiRequest request
    ) {
        try {
            DonHang updated = donHangService.updateTrangThai(id, request.getTrangThai());
            return updated == null ? ResponseEntity.notFound().build() : ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        return donHangService.delete(id)
                ? ResponseEntity.ok().build()
                : ResponseEntity.notFound().build();
    }

    @GetMapping("/nguoi-dung/{nguoiDungId}")
    public ResponseEntity<List<DonHang>> getDonHangByNguoiDung(@PathVariable Long nguoiDungId) {
        try {
            return ResponseEntity.ok(donHangService.getDonHangByNguoiDungId(nguoiDungId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/nguoi-dung")
    public ResponseEntity<List<DonHang>> getDonHangByNguoiDungParam(@RequestParam Long nguoiDungId) {
        try {
            return ResponseEntity.ok(donHangService.getDonHangByNguoiDungId(nguoiDungId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PatchMapping("/huy/{id}")
    public ResponseEntity<DonHang> huyDonHang(
            @PathVariable Long id,
            @RequestParam Long nguoiDungId
    ) {
        try {
            DonHang updated = donHangService.huyDonHang(id, nguoiDungId);
            return updated == null ? ResponseEntity.notFound().build() : ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    @GetMapping("/cho-shipper")
    public ResponseEntity<List<DonHang>> choShipper() {
        return ResponseEntity.ok(donHangService.getDonChoShipperNhan());
    }

    @PatchMapping("/{id}/nhan")
    public ResponseEntity<?> nhanDon(
            @PathVariable Long id,
            @RequestParam Long shipperId
    ) {
        try {
            return ResponseEntity.ok(donHangService.shipperNhanDon(id, shipperId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/shipper/{shipperId}")
    public ResponseEntity<List<DonHang>> shipperDon(@PathVariable Long shipperId) {
        return ResponseEntity.ok(donHangService.getDonDangGiaoByShipper(shipperId));
    }

    // ── Hoàn thành đơn — backend check shipperId ──
    @PatchMapping("/{id}/hoan-thanh")
    public ResponseEntity<?> hoanThanh(
            @PathVariable Long id,
            @RequestParam Long shipperId
    ) {
        try {
            return ResponseEntity.ok(donHangService.hoanThanhDon(id, shipperId));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ── Reset shipper (chỉ ADMIN / QUANLY) ──
    @PatchMapping("/{id}/reset-shipper")
    public ResponseEntity<?> resetShipper(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(donHangService.resetShipper(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
        }
    }

    // ── Đổi shipper (chỉ ADMIN / QUANLY) ──
    @PatchMapping("/{id}/doi-shipper")
    public ResponseEntity<?> doiShipper(
            @PathVariable Long id,
            @RequestParam Long shipperId
    ) {
        try {
            return ResponseEntity.ok(donHangService.doiShipper(id, shipperId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
        }
    }

    // ── Danh sách shipper ──
    @GetMapping("/danh-sach-shipper")
    public ResponseEntity<List<NguoiDung>> getDanhSachShipper() {
        return ResponseEntity.ok(donHangService.getDanhSachShipper());
    }
}