package com.ths.onlinefood.service;

import com.ths.onlinefood.model.HoaDon;
import com.ths.onlinefood.model.DonHang;
import com.ths.onlinefood.model.NguoiDung;
import com.ths.onlinefood.repository.HoaDonRepository;
import com.ths.onlinefood.repository.DonHangRepository;
import com.ths.onlinefood.repository.NguoiDungRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class HoaDonService {
    
    private final HoaDonRepository hoaDonRepository;
    private final DonHangRepository donHangRepository;
    private final NguoiDungRepository nguoiDungRepository;
    
    public List<HoaDon> getAll() {
        return hoaDonRepository.findAll();
    }
    
    public Optional<HoaDon> getById(Long id) {
        return hoaDonRepository.findByIdWithDetails(id);
    }

    public Optional<HoaDon> getByDonHangId(Long donHangId) {
        return hoaDonRepository.findByDonHangIdWithDetails(donHangId);
    }
    
    /**
     * Lấy hóa đơn theo ID đơn hàng với kiểm tra email
     */
    public HoaDon getByDonHangIdWithEmailCheck(Long donHangId, String userEmail, boolean isAdminOrManager) {
        try {
            // Tìm hóa đơn
            Optional<HoaDon> optionalHoaDon = hoaDonRepository.findByDonHangIdWithDetails(donHangId);
            
            if (!optionalHoaDon.isPresent()) {
                return null; // Không tìm thấy hóa đơn
            }
            
            HoaDon hoaDon = optionalHoaDon.get();
            
            // Nếu là Admin hoặc Quản lý thì cho phép xem tất cả
            if (isAdminOrManager) {
                System.out.println("Admin/Quản lý truy cập hóa đơn: " + hoaDon.getId());
                return hoaDon;
            }
            
            // Kiểm tra email của người dùng sở hữu đơn hàng
            DonHang donHang = hoaDon.getDonHang();
            if (donHang == null || donHang.getNguoiDung() == null) {
                throw new SecurityException("Không thể xác định chủ sở hữu đơn hàng");
            }
            
            String ownerEmail = donHang.getNguoiDung().getEmail();
            
            if (ownerEmail == null || !ownerEmail.equals(userEmail)) {
                System.out.println("Từ chối truy cập: " + userEmail + " != " + ownerEmail);
                throw new SecurityException("Bạn không có quyền xem hóa đơn này");
            }
            
            System.out.println("Cho phép truy cập hóa đơn: " + hoaDon.getId() + " cho email: " + userEmail);
            return hoaDon;
            
        } catch (SecurityException e) {
            throw e; // Ném lại lỗi bảo mật
        } catch (Exception e) {
            System.err.println("Lỗi khi kiểm tra quyền truy cập hóa đơn: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Có lỗi xảy ra khi kiểm tra quyền truy cập: " + e.getMessage());
        }
    }
   
    @Transactional
    public HoaDon taoHoaDonTuDonHang(Long donHangId, String phuongThucThanhToan, String maGiaoDich) {
        try {
            DonHang donHang = donHangRepository.findById(donHangId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng với ID: " + donHangId));
                  
            Optional<HoaDon> existingHoaDon = hoaDonRepository.findByDonHangId(donHangId);
            if (existingHoaDon.isPresent()) {
                System.out.println("Đơn hàng đã có hóa đơn ID: " + existingHoaDon.get().getId());
                throw new RuntimeException("Đơn hàng đã có hóa đơn");
            }
            
            NguoiDung nguoiDung = donHang.getNguoiDung();
            if (nguoiDung == null) {
                throw new RuntimeException("Không tìm thấy người dùng cho đơn hàng");
            }

            HoaDon hoaDon = new HoaDon();
            hoaDon.setDonHang(donHang);
            
            hoaDon.setHoTen(nguoiDung.getHoTen());
            hoaDon.setDiaChi(donHang.getDiaChiGiaoHang());
            hoaDon.setSoDienThoai(nguoiDung.getSoDienThoai());
            
            Double tongTien = donHang.getTongTien();
            if (tongTien == null || tongTien < 0) {
                throw new RuntimeException("Tổng tiền đơn hàng không hợp lệ: " + tongTien);
            }
            hoaDon.setTongTien(tongTien); 
            
            hoaDon.setPhuongThuc(phuongThucThanhToan);
            hoaDon.setThoiGianThanhToan(new Date());
            
            if ("COD".equals(phuongThucThanhToan)) {
                hoaDon.setTrangThai("CHUA_THANH_TOAN");
            } else {
                hoaDon.setTrangThai("DA_THANH_TOAN");
            }
            
            hoaDon.setMaGD(maGiaoDich);
            
            HoaDon savedHoaDon = hoaDonRepository.save(hoaDon);
            
            return savedHoaDon;
            
        } catch (Exception e) {
            System.err.println("LỖI khi tạo hóa đơn: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Không thể tạo hóa đơn: " + e.getMessage());
        }
    }
    
    public HoaDon taoHoaDonCOD(Long donHangId) {
        String maGiaoDichCOD = "COD_" + System.currentTimeMillis() + "_" + donHangId;
        return taoHoaDonTuDonHang(donHangId, "COD", maGiaoDichCOD);
    }
  
    public HoaDon taoHoaDonVNPay(Long donHangId, String vnpTransactionNo) {
        if (vnpTransactionNo == null || vnpTransactionNo.trim().isEmpty()) {
            throw new RuntimeException("Mã giao dịch VNPay không được để trống");
        }
        return taoHoaDonTuDonHang(donHangId, "VNPAY", vnpTransactionNo);
    }
    
    public HoaDon create(HoaDon hoaDon) {
        hoaDon.setThoiGianThanhToan(new Date());
        return hoaDonRepository.save(hoaDon);
    }
    
    public HoaDon update(Long id, HoaDon newHoaDon) {
        return hoaDonRepository.findById(id).map(hd -> {
            hd.setHoTen(newHoaDon.getHoTen());
            hd.setDiaChi(newHoaDon.getDiaChi());
            hd.setSoDienThoai(newHoaDon.getSoDienThoai());
            hd.setPhuongThuc(newHoaDon.getPhuongThuc());
            hd.setThoiGianThanhToan(newHoaDon.getThoiGianThanhToan());
            hd.setTrangThai(newHoaDon.getTrangThai());
            hd.setMaGD(newHoaDon.getMaGD());
            
            if (newHoaDon.getTongTien() != null && newHoaDon.getTongTien() >= 0) {
                hd.setTongTien(newHoaDon.getTongTien());
            }
            
            return hoaDonRepository.save(hd);
        }).orElse(null);
    }
    
    @Transactional
    public void capNhatThanhToanKhiHoanThanh(Long donHangId) {
        try {
            Optional<HoaDon> optionalHoaDon = hoaDonRepository.findByDonHangId(donHangId);
            
            if (optionalHoaDon.isPresent()) {
                HoaDon hoaDon = optionalHoaDon.get();
                
                if ("CHUA_THANH_TOAN".equals(hoaDon.getTrangThai())) {
                    hoaDon.setTrangThai("DA_THANH_TOAN");
                    hoaDon.setThoiGianThanhToan(new Date());
                    hoaDonRepository.save(hoaDon);
                    
                    System.out.println("Đã cập nhật trạng thái hóa đơn thành DA_THANH_TOAN cho đơn hàng: " + donHangId);
                } else {
                    System.out.println("Hóa đơn đã được thanh toán trước đó cho đơn hàng: " + donHangId);
                }
            } else {
                System.out.println("Chưa có hóa đơn cho đơn hàng " + donHangId + ", tạo hóa đơn COD và đánh dấu đã thanh toán");
            }
            
        } catch (Exception e) {
            System.err.println("Lỗi khi cập nhật trạng thái hóa đơn khi hoàn thành: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Không thể cập nhật trạng thái hóa đơn: " + e.getMessage());
        }
    }
    
    public boolean delete(Long id) {
        if (!hoaDonRepository.existsById(id)) return false;
        hoaDonRepository.deleteById(id);
        return true;
    }
}