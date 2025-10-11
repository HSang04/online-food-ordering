package com.ths.onlinefood.service;

import com.ths.onlinefood.model.*;
import com.ths.onlinefood.repository.*;
import com.ths.onlinefood.request.ChiTietDonHangRequest;
import com.ths.onlinefood.request.DonHangRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DonHangService {

    private static final Logger logger = LoggerFactory.getLogger(DonHangService.class);
    
    private final DonHangRepository donHangRepository;
    private final ChiTietDonHangRepository chiTietDonHangRepository;
    private final GioHangRepository gioHangRepository;
    private final NguoiDungRepository nguoiDungRepository;
    private final MonAnService monAnService;
    private final VoucherRepository voucherRepository;
    private final VoucherService voucherService;
    private HoaDonService hoaDonService;
    
    @Transactional
    public DonHang createFromRequest(DonHangRequest request) {
        NguoiDung nguoiDung = nguoiDungRepository.findById(request.getNguoiDungId())
                .orElseThrow(() -> new IllegalArgumentException("Người dùng không tồn tại"));

      
        if (request.getVoucherId() != null) {
            Voucher voucher = voucherRepository.findById(request.getVoucherId())
                .orElseThrow(() -> new IllegalArgumentException("Voucher không tồn tại"));
            
        
            Map<String, Object> voucherValidation = voucherService.validateVoucherForOrder(
                voucher.getMaVoucher(), 
                request.getTongTienGoc() != null ? request.getTongTienGoc() : request.getTongTien()
            );
            
            if (!(Boolean) voucherValidation.get("valid")) {
                String errorMessage = (String) voucherValidation.get("message");
                throw new IllegalArgumentException("Voucher không hợp lệ: " + errorMessage);
            }
            
            logger.info("Voucher {} đã được validate thành công cho đơn hàng", voucher.getMaVoucher());
        }

        DonHang donHang = new DonHang();
        donHang.setNgayTao(LocalDateTime.now());
        donHang.setTrangThai(TrangThaiDonHang_ENUM.DANG_XU_LY);
        donHang.setTongTien(request.getTongTien());
        donHang.setNguoiDung(nguoiDung);
        donHang.setDiaChiGiaoHang(request.getDiaChiGiaoHang());
        donHang.setGhiChu(request.getGhiChu());
        
        if (request.getVoucherId() != null) {
            Voucher voucher = voucherRepository.findById(request.getVoucherId())
                .orElseThrow(() -> new IllegalArgumentException("Voucher không tồn tại"));
            donHang.setVoucher(voucher);
        }
        
        DonHang savedDonHang = donHangRepository.save(donHang);

      
        for (ChiTietDonHangRequest ctReq : request.getChiTietDonHang()) {
            ChiTietDonHang ct = new ChiTietDonHang();
            ct.setDonHang(savedDonHang);
            Optional<MonAn> monAnOpt = monAnService.getById(ctReq.getMonAnId());
            if (monAnOpt.isEmpty()) {
                throw new IllegalArgumentException("Món ăn không tồn tại với ID: " + ctReq.getMonAnId());
            }
            ct.setMonAn(monAnOpt.get());
            ct.setSoLuong(ctReq.getSoLuong());
            ct.setDonGia(ctReq.getGia());
            
            chiTietDonHangRepository.save(ct);
        }

       
        // xu ly Voucher +-
        if (request.getVoucherId() != null) {
            Voucher voucher = voucherRepository.findById(request.getVoucherId()).get();
            boolean voucherUsed = voucherService.useVoucher(voucher.getMaVoucher());
            if (!voucherUsed) {
                logger.warn("Không thể sử dụng voucher {} cho đơn hàng {}", 
                    voucher.getMaVoucher(), savedDonHang.getId());
            }
        }

      
        gioHangRepository.deleteAllByNguoiDung(nguoiDung);

        logger.info("Đơn hàng {} được tạo thành công cho người dùng {}", 
            savedDonHang.getId(), nguoiDung.getId());
        
        return savedDonHang;
    }

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
        Optional<DonHang> optional = donHangRepository.findById(id);
        if (optional.isEmpty()) return null;

        DonHang donHang = optional.get();

        try {
            TrangThaiDonHang_ENUM enumValue = TrangThaiDonHang_ENUM.valueOf(trangThai.toUpperCase());
            donHang.setTrangThai(enumValue);
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

   
    @Transactional
    public DonHang huyDonHang(Long donHangId, Long nguoiDungId) {
        // Tìm đơn hàng
        DonHang donHang = donHangRepository.findById(donHangId)
                .orElseThrow(() -> new IllegalArgumentException("Đơn hàng không tồn tại"));

        // Kiểm tra quyền sở hữu
        if (!donHang.getNguoiDung().getId().equals(nguoiDungId)) {
            throw new SecurityException("Bạn không có quyền hủy đơn hàng này");
        }

        // Chỉ cho phép hủy khi đang xử lý
        if (!donHang.getTrangThai().equals(TrangThaiDonHang_ENUM.DANG_XU_LY)) {
            throw new IllegalArgumentException("Chỉ có thể hủy đơn hàng khi đang xử lý");
        }

        // Cập nhật trạng thái
        donHang.setTrangThai(TrangThaiDonHang_ENUM.DA_HUY);


        DonHang savedDonHang = donHangRepository.save(donHang);
        logger.info("Đơn hàng {} đã được hủy bởi người dùng {}", donHangId, nguoiDungId);

        return savedDonHang;
    }
    
   
}