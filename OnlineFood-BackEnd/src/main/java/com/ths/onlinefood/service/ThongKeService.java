package com.ths.onlinefood.service;

import com.ths.onlinefood.model.DonHang;
import com.ths.onlinefood.model.TrangThaiDonHang_ENUM;
import com.ths.onlinefood.repository.DonHangRepository;
import com.ths.onlinefood.repository.ChiTietDonHangRepository;
import com.ths.onlinefood.repository.VoucherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;


@Service
@RequiredArgsConstructor
public class ThongKeService {

    private static final Logger logger = LoggerFactory.getLogger(ThongKeService.class);
    
    private final DonHangRepository donHangRepository;
    private final ChiTietDonHangRepository chiTietDonHangRepository;
    private final VoucherRepository voucherRepository;


    public Map<String, Object> getDoanhThuTheoNgay(LocalDate tuNgay, LocalDate denNgay) {
        LocalDateTime tuNgayTime = tuNgay.atStartOfDay();
        LocalDateTime denNgayTime = denNgay.atTime(23, 59, 59);
        
        // Chỉ lấy các đơn hàng HOÀN THÀNH để tính doanh thu
        List<DonHang> donHangs = donHangRepository.findByNgayTaoBetweenAndTrangThai(
            tuNgayTime, denNgayTime, TrangThaiDonHang_ENUM.HOAN_THANH);
        
        Map<String, Double> doanhThuTheoNgay = new LinkedHashMap<>();
        Map<String, Integer> soDonTheoNgay = new LinkedHashMap<>();
        
        LocalDate current = tuNgay;
        while (!current.isAfter(denNgay)) {
            String ngayStr = current.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
            doanhThuTheoNgay.put(ngayStr, 0.0);
            soDonTheoNgay.put(ngayStr, 0);
            current = current.plusDays(1);
        }
        
        for (DonHang donHang : donHangs) {
            String ngayStr = donHang.getNgayTao().toLocalDate()
                .format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
            
            doanhThuTheoNgay.put(ngayStr, 
                doanhThuTheoNgay.get(ngayStr) + donHang.getTongTien());
            soDonTheoNgay.put(ngayStr, 
                soDonTheoNgay.get(ngayStr) + 1);
        }
        
        double tongDoanhThu = donHangs.stream()
            .mapToDouble(DonHang::getTongTien)
            .sum();
        
        Map<String, Object> result = new HashMap<>();
        result.put("doanhThuTheoNgay", doanhThuTheoNgay);
        result.put("soDonTheoNgay", soDonTheoNgay);
        result.put("tongDoanhThu", tongDoanhThu);
        result.put("tongSoDon", donHangs.size());
        result.put("doanhThuTrungBinh", donHangs.isEmpty() ? 0 : tongDoanhThu / donHangs.size());
        
        return result;
    }

    public Map<String, Object> getDoanhThuTheoThang(int nam) {
        LocalDateTime tuNgay = LocalDate.of(nam, 1, 1).atStartOfDay();
        LocalDateTime denNgay = LocalDate.of(nam, 12, 31).atTime(23, 59, 59);
        
      
        List<DonHang> donHangs = donHangRepository.findByNgayTaoBetweenAndTrangThai(
            tuNgay, denNgay, TrangThaiDonHang_ENUM.HOAN_THANH);
        
        Map<String, Double> doanhThuTheoThang = new LinkedHashMap<>();
        Map<String, Integer> soDonTheoThang = new LinkedHashMap<>();
        
        for (int thang = 1; thang <= 12; thang++) {
            String thangStr = String.format("Tháng %02d", thang);
            doanhThuTheoThang.put(thangStr, 0.0);
            soDonTheoThang.put(thangStr, 0);
        }
        
        for (DonHang donHang : donHangs) {
            int thang = donHang.getNgayTao().getMonthValue();
            String thangStr = String.format("Tháng %02d", thang);
            
            doanhThuTheoThang.put(thangStr, 
                doanhThuTheoThang.get(thangStr) + donHang.getTongTien());
            soDonTheoThang.put(thangStr, 
                soDonTheoThang.get(thangStr) + 1);
        }
        
        double tongDoanhThu = donHangs.stream()
            .mapToDouble(DonHang::getTongTien)
            .sum();
        
        Map<String, Object> result = new HashMap<>();
        result.put("doanhThuTheoThang", doanhThuTheoThang);
        result.put("soDonTheoThang", soDonTheoThang);
        result.put("tongDoanhThu", tongDoanhThu);
        result.put("tongSoDon", donHangs.size());
        result.put("doanhThuTrungBinh", donHangs.isEmpty() ? 0 : tongDoanhThu / donHangs.size());
        
        return result;
    }

    public Map<String, Object> getMonAnBanChay(LocalDate tuNgay, LocalDate denNgay, int limit) {
        LocalDateTime tuNgayTime = tuNgay.atStartOfDay();
        LocalDateTime denNgayTime = denNgay.atTime(23, 59, 59);
        
     
        List<Object[]> results = chiTietDonHangRepository.findTopSellingItemsCompleted(
            tuNgayTime, denNgayTime, TrangThaiDonHang_ENUM.HOAN_THANH);
        
        List<Map<String, Object>> topMonAn = new ArrayList<>();
        double tongSoLuongBan = 0;
        double tongDoanhThuMonAn = 0;
        
        int count = 0;
        for (Object[] result : results) {
            if (count >= limit) break;
            
            Map<String, Object> item = new HashMap<>();
            item.put("tenMonAn", result[0]);
            item.put("soLuongBan", result[1]);
            item.put("doanhThu", result[2]);
            item.put("donGiaTrungBinh", result[3]);
            
            topMonAn.add(item);
            tongSoLuongBan += ((Number) result[1]).doubleValue();
            tongDoanhThuMonAn += ((Number) result[2]).doubleValue();
            count++;
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("topMonAn", topMonAn);
        response.put("tongSoLuongBan", tongSoLuongBan);
        response.put("tongDoanhThuMonAn", tongDoanhThuMonAn);
        response.put("soMonKhacNhau", topMonAn.size());
        
        return response;
    }

   
    public Map<String, Object> getThongKeVoucher(LocalDate tuNgay, LocalDate denNgay) {
        LocalDateTime tuNgayTime = tuNgay.atStartOfDay();
        LocalDateTime denNgayTime = denNgay.atTime(23, 59, 59);
        
      
        List<Object[]> voucherStats = donHangRepository.findVoucherUsageStatsBasic(
            tuNgayTime, denNgayTime, TrangThaiDonHang_ENUM.HOAN_THANH);
        
        List<Map<String, Object>> voucherData = new ArrayList<>();
        int tongLuotSuDung = 0;
        
        for (Object[] stat : voucherStats) {
            Map<String, Object> item = new HashMap<>();
            item.put("maVoucher", stat[0]);
            item.put("moTa", stat[1]);
            item.put("loai", stat[2]);
            item.put("giaTri", stat[3]);
            item.put("soLuotSuDung", stat[4]);
            
            voucherData.add(item);
            tongLuotSuDung += ((Number) stat[4]).intValue();
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("voucherData", voucherData);
        result.put("tongLuotSuDung", tongLuotSuDung);
        result.put("soVoucherKhacNhau", voucherData.size());
        
        return result;
    }

    public Map<String, Object> getThongKeTongQuan() {
        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);
        LocalDate weekAgo = today.minusDays(7);
        LocalDate monthAgo = today.minusMonths(1);
        
        Map<String, Object> homNay = getDoanhThuTheoNgay(today, today);
        Map<String, Object> homQua = getDoanhThuTheoNgay(yesterday, yesterday);
        Map<String, Object> tuanQua = getDoanhThuTheoNgay(weekAgo, today);
        Map<String, Object> thangQua = getDoanhThuTheoNgay(monthAgo, today);
        
        Map<String, Long> thongKeTrangThai = new HashMap<>();
        for (TrangThaiDonHang_ENUM trangThai : TrangThaiDonHang_ENUM.values()) {
            long count = donHangRepository.countByTrangThai(trangThai);
            thongKeTrangThai.put(trangThai.name(), count);
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("homNay", homNay);
        result.put("homQua", homQua);
        result.put("tuanQua", tuanQua);
        result.put("thangQua", thangQua);
        result.put("thongKeTrangThai", thongKeTrangThai);
        
        return result;
    }

    public Map<String, Object> soSanhDoanhThu(LocalDate tuNgay1, LocalDate denNgay1, 
                                             LocalDate tuNgay2, LocalDate denNgay2) {
        Map<String, Object> kyHienTai = getDoanhThuTheoNgay(tuNgay1, denNgay1);
        Map<String, Object> kyTruoc = getDoanhThuTheoNgay(tuNgay2, denNgay2);
        
        double doanhThuHienTai = (Double) kyHienTai.get("tongDoanhThu");
        double doanhThuTruoc = (Double) kyTruoc.get("tongDoanhThu");
        
        double tiLeThayDoi = doanhThuTruoc == 0 ? 0 : 
            ((doanhThuHienTai - doanhThuTruoc) / doanhThuTruoc) * 100;
        
        int soDonHienTai = (Integer) kyHienTai.get("tongSoDon");
        int soDonTruoc = (Integer) kyTruoc.get("tongSoDon");
        
        double tiLeDonHang = soDonTruoc == 0 ? 0 : 
            ((double)(soDonHienTai - soDonTruoc) / soDonTruoc) * 100;
        
        Map<String, Object> result = new HashMap<>();
        result.put("kyHienTai", kyHienTai);
        result.put("kyTruoc", kyTruoc);
        result.put("tiLeThayDoiDoanhThu", tiLeThayDoi);
        result.put("tiLeThayDoiDonHang", tiLeDonHang);
        result.put("chenhLechDoanhThu", doanhThuHienTai - doanhThuTruoc);
        result.put("chenhLechDonHang", soDonHienTai - soDonTruoc);
        
        return result;
    }
}