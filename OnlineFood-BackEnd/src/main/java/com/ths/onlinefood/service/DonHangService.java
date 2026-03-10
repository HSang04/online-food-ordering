package com.ths.onlinefood.service;

import com.ths.onlinefood.config.JwtConstant;
import com.ths.onlinefood.model.*;
import com.ths.onlinefood.repository.*;
import com.ths.onlinefood.request.ChiTietDonHangRequest;
import com.ths.onlinefood.request.DonHangRequest;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.SecretKey;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class DonHangService {

    private static final Logger logger = LoggerFactory.getLogger(DonHangService.class);

    private final DonHangRepository          donHangRepository;
    private final ChiTietDonHangRepository   chiTietDonHangRepository;
    private final GioHangRepository          gioHangRepository;
    private final NguoiDungRepository        nguoiDungRepository;
    private final MonAnService               monAnService;
    private final VoucherRepository          voucherRepository;
    private final VoucherService             voucherService;

    private HoaDonService hoaDonService;

    // ─────────────────────────────────────────────────────────────
    // Tạo đơn hàng
    // ─────────────────────────────────────────────────────────────
    @Transactional
    public DonHang createFromRequest(DonHangRequest request) {
        NguoiDung nguoiDung = nguoiDungRepository.findById(request.getNguoiDungId())
                .orElseThrow(() -> new IllegalArgumentException("Người dùng không tồn tại"));

        if (request.getVoucherId() != null) {
            Voucher voucher = voucherRepository.findById(request.getVoucherId())
                    .orElseThrow(() -> new IllegalArgumentException("Voucher không tồn tại"));

            Map<String, Object> validation = voucherService.validateVoucherForOrder(
                    voucher.getMaVoucher(),
                    request.getTongTienGoc() != null ? request.getTongTienGoc() : request.getTongTien()
            );

            if (!(Boolean) validation.get("valid")) {
                throw new IllegalArgumentException("Voucher không hợp lệ: " + validation.get("message"));
            }
            logger.info("Voucher {} đã validate thành công", voucher.getMaVoucher());
        }

        DonHang donHang = new DonHang();
        donHang.setNgayTao(LocalDateTime.now());
        donHang.setTrangThai(TrangThaiDonHang_ENUM.DANG_XU_LY);
        donHang.setTongTien(request.getTongTien());
        donHang.setNguoiDung(nguoiDung);
        donHang.setDiaChiGiaoHang(request.getDiaChiGiaoHang());
        donHang.setGhiChu(request.getGhiChu());
        donHang.setLatGiaoHang(request.getLatGiaoHang());
        donHang.setLonGiaoHang(request.getLonGiaoHang());

        if (request.getVoucherId() != null) {
            Voucher voucher = voucherRepository.findById(request.getVoucherId())
                    .orElseThrow(() -> new IllegalArgumentException("Voucher không tồn tại"));
            donHang.setVoucher(voucher);
        }

        DonHang saved = donHangRepository.save(donHang);

        for (ChiTietDonHangRequest ctReq : request.getChiTietDonHang()) {
            ChiTietDonHang ct = new ChiTietDonHang();
            ct.setDonHang(saved);
            MonAn monAn = monAnService.getById(ctReq.getMonAnId())
                    .orElseThrow(() -> new IllegalArgumentException("Món ăn không tồn tại: " + ctReq.getMonAnId()));
            ct.setMonAn(monAn);
            ct.setSoLuong(ctReq.getSoLuong());
            ct.setDonGia(ctReq.getGia());
            chiTietDonHangRepository.save(ct);
        }

        if (request.getVoucherId() != null) {
            Voucher voucher = voucherRepository.findById(request.getVoucherId()).get();
            if (!voucherService.useVoucher(voucher.getMaVoucher())) {
                logger.warn("Không thể dùng voucher {} cho đơn {}", voucher.getMaVoucher(), saved.getId());
            }
        }

        gioHangRepository.deleteAllByNguoiDung(nguoiDung);
        logger.info("Đơn hàng {} tạo thành công cho người dùng {}", saved.getId(), nguoiDung.getId());
        return saved;
    }

    // ─────────────────────────────────────────────────────────────
    // CRUD cơ bản
    // ─────────────────────────────────────────────────────────────
    public List<DonHang> getAll() {
        return donHangRepository.findAll();
    }

    public Optional<DonHang> getById(Long id) {
        return donHangRepository.findById(id);
    }

    public DonHang update(Long id, DonHang newDH) {
        return donHangRepository.findById(id).map(dh -> {
            dh.setNgayTao(newDH.getNgayTao());
            dh.setTrangThai(newDH.getTrangThai());
            dh.setTongTien(newDH.getTongTien());
            dh.setNguoiDung(newDH.getNguoiDung());
            dh.setVoucher(newDH.getVoucher());
            dh.setGhiChu(newDH.getGhiChu());
            return donHangRepository.save(dh);
        }).orElse(null);
    }

    public DonHang updateTrangThai(Long id, String trangThai) {
        DonHang donHang = donHangRepository.findById(id).orElse(null);
        if (donHang == null) return null;
        try {
            donHang.setTrangThai(TrangThaiDonHang_ENUM.valueOf(trangThai.toUpperCase()));
            return donHangRepository.save(donHang);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Trạng thái không hợp lệ: " + trangThai);
        }
    }

    public boolean delete(Long id) {
        if (!donHangRepository.existsById(id)) return false;
        donHangRepository.deleteById(id);
        return true;
    }

    public List<DonHang> getDonHangByNguoiDungId(Long nguoiDungId) {
        NguoiDung nguoiDung = nguoiDungRepository.findById(nguoiDungId)
                .orElseThrow(() -> new IllegalArgumentException("Người dùng không tồn tại"));
        return donHangRepository.findByNguoiDungOrderByNgayTaoDesc(nguoiDung);
    }

    // ─────────────────────────────────────────────────────────────
    // Hủy đơn (khách hàng)
    // ─────────────────────────────────────────────────────────────
    @Transactional
    public DonHang huyDonHang(Long donHangId, Long nguoiDungId) {
        DonHang donHang = donHangRepository.findById(donHangId)
                .orElseThrow(() -> new IllegalArgumentException("Đơn hàng không tồn tại"));

        if (!donHang.getNguoiDung().getId().equals(nguoiDungId))
            throw new SecurityException("Bạn không có quyền hủy đơn hàng này");

        if (!donHang.getTrangThai().equals(TrangThaiDonHang_ENUM.DANG_XU_LY))
            throw new IllegalArgumentException("Chỉ có thể hủy đơn hàng khi đang xử lý");

        donHang.setTrangThai(TrangThaiDonHang_ENUM.DA_HUY);
        DonHang saved = donHangRepository.save(donHang);
        logger.info("Đơn hàng {} đã hủy bởi người dùng {}", donHangId, nguoiDungId);
        return saved;
    }

    // ─────────────────────────────────────────────────────────────
    // Shipper nhận đơn
    // ─────────────────────────────────────────────────────────────
    public List<DonHang> getDonChoShipperNhan() {
        return donHangRepository.findByTrangThaiAndNvGiaoHangIsNull(TrangThaiDonHang_ENUM.DANG_GIAO);
    }

    @Transactional
    public DonHang shipperNhanDon(Long donHangId, Long shipperId) {
        DonHang dh = donHangRepository.findByIdWithLock(donHangId)
                .orElseThrow(() -> new IllegalArgumentException("Đơn không tồn tại"));

        if (dh.getNvGiaoHang() != null)
            throw new IllegalStateException("Đơn đã có shipper nhận rồi");

       if (dh.getTrangThai() != TrangThaiDonHang_ENUM.DANG_GIAO)
          throw new IllegalStateException("Đơn không ở trạng thái chờ nhận");

        NguoiDung shipper = nguoiDungRepository.findById(shipperId)
                .orElseThrow(() -> new IllegalArgumentException("Shipper không tồn tại"));

        dh.setNvGiaoHang(shipper);
        dh.setTrangThai(TrangThaiDonHang_ENUM.DANG_GIAO);

        logger.info("Shipper {} nhận đơn {}", shipperId, donHangId);
        return donHangRepository.save(dh);
    }

    public List<DonHang> getDonDangGiaoByShipper(Long shipperId) {
        return donHangRepository.findByNvGiaoHangIdAndTrangThai(shipperId, TrangThaiDonHang_ENUM.DANG_GIAO);
    }

    // ─────────────────────────────────────────────────────────────
    // Hoàn thành đơn — shipper phải đúng chủ đơn
    // ─────────────────────────────────────────────────────────────
    @Transactional
    public DonHang hoanThanhDon(Long donHangId, Long shipperId) {
        DonHang dh = donHangRepository.findById(donHangId)
                .orElseThrow(() -> new IllegalArgumentException("Đơn không tồn tại"));

        // Đơn chưa có shipper
        if (dh.getNvGiaoHang() == null)
            throw new IllegalStateException("Đơn hàng chưa có shipper nhận");

        // Shipper không phải chủ đơn
        if (!dh.getNvGiaoHang().getId().equals(shipperId))
            throw new SecurityException("Bạn không phải shipper của đơn này");

        if (dh.getTrangThai() != TrangThaiDonHang_ENUM.DANG_GIAO)
            throw new IllegalStateException("Đơn không ở trạng thái đang giao");

        dh.setTrangThai(TrangThaiDonHang_ENUM.HOAN_THANH);
        dh.setThoiGianHoanThanh(LocalDateTime.now());

        logger.info("Đơn hàng {} hoàn thành bởi shipper {}", donHangId, shipperId);
        return donHangRepository.save(dh);
    }

    // ─────────────────────────────────────────────────────────────
    // Reset / đổi shipper (chỉ ADMIN / QUANLY)
    // ─────────────────────────────────────────────────────────────
    @Transactional
    public DonHang resetShipper(Long donHangId) {
        DonHang dh = donHangRepository.findById(donHangId)
                .orElseThrow(() -> new IllegalArgumentException("Đơn hàng không tồn tại"));

        if (dh.getTrangThai() != TrangThaiDonHang_ENUM.DANG_GIAO)
            throw new IllegalStateException("Chỉ có thể reset shipper khi đơn đang DANG_GIAO");

        logger.info("Reset shipper đơn {} (shipper cũ: {})", donHangId,
                dh.getNvGiaoHang() != null ? dh.getNvGiaoHang().getId() : "null");

        dh.setNvGiaoHang(null);
        dh.setTrangThai(TrangThaiDonHang_ENUM.DANG_LAM);
        return donHangRepository.save(dh);
    }

    @Transactional
    public DonHang doiShipper(Long donHangId, Long shipperId) {
        DonHang dh = donHangRepository.findById(donHangId)
                .orElseThrow(() -> new IllegalArgumentException("Đơn hàng không tồn tại"));

        if (dh.getTrangThai() != TrangThaiDonHang_ENUM.DANG_GIAO)
            throw new IllegalStateException("Chỉ có thể đổi shipper khi đơn đang DANG_GIAO");

        NguoiDung shipperMoi = nguoiDungRepository.findById(shipperId)
                .orElseThrow(() -> new IllegalArgumentException("Shipper không tồn tại"));

        if (shipperMoi.getVaiTro() != USER_ROLE.NHANVIEN_GIAOHANG)
            throw new IllegalArgumentException("Người dùng này không phải shipper");

        logger.info("Đổi shipper đơn {} từ {} sang {}", donHangId,
                dh.getNvGiaoHang() != null ? dh.getNvGiaoHang().getId() : "null", shipperId);

        dh.setNvGiaoHang(shipperMoi);
        return donHangRepository.save(dh);
    }

    public List<NguoiDung> getDanhSachShipper() {
        return nguoiDungRepository.findByVaiTro(USER_ROLE.NHANVIEN_GIAOHANG);
    }

    // ─────────────────────────────────────────────────────────────
    // Parse JWT → NguoiDung (dùng cho ownership check ở Controller)
    // ─────────────────────────────────────────────────────────────
    public NguoiDung getUserFromToken(String jwt) {
        SecretKey key = Keys.hmacShaKeyFor(JwtConstant.SECRET_KEY.getBytes());
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(jwt)
                .getBody();
        String username = String.valueOf(claims.get("username"));
        return nguoiDungRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Người dùng không tồn tại"));
    }
}