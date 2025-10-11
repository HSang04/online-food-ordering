package com.ths.onlinefood.service;

import com.ths.onlinefood.dto.GioHangDTO;
import com.ths.onlinefood.dto.GioHangThongKeDTO;
import com.ths.onlinefood.model.GioHang;
import com.ths.onlinefood.model.MonAn;
import com.ths.onlinefood.model.NguoiDung;
import com.ths.onlinefood.repository.GioHangRepository;
import com.ths.onlinefood.repository.MonAnRepository;
import com.ths.onlinefood.repository.NguoiDungRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GioHangService {
    
    private final GioHangRepository gioHangRepo;
    private final MonAnRepository monAnRepo;
    private final NguoiDungRepository nguoiDungRepo;
    private final GioHangDTOConverter gioHangDTOConverter;

    public List<GioHangDTO> getGioHangByNguoiDungId(Long nguoiDungId) {
        NguoiDung nguoiDung = nguoiDungRepo.findById(nguoiDungId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        
        List<GioHang> gioHangList = gioHangRepo.findByNguoiDungAndMonAn_TrangThai(nguoiDung, 1);

        return gioHangList.stream()
                .map(gioHangDTOConverter::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public GioHangDTO addToCart(Long nguoiDungId, Long monAnId, Integer soLuong) {
        NguoiDung nguoiDung = nguoiDungRepo.findById(nguoiDungId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        
        MonAn monAn = monAnRepo.findById(monAnId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy món ăn"));

        if (monAn.getTrangThai() != 1) {
            throw new RuntimeException("Món ăn đã ngừng bán");
        }

        GioHang item = gioHangRepo.findByNguoiDungAndMonAn_Id(nguoiDung, monAnId)
                .map(existing -> {
                    existing.setSoLuong(existing.getSoLuong() + soLuong);
                    return existing;
                })
                .orElse(GioHang.builder()
                        .nguoiDung(nguoiDung)
                        .monAn(monAn)
                        .soLuong(soLuong)
                        .build());

        return gioHangDTOConverter.convertToDTO(gioHangRepo.save(item));
    }

    public GioHangDTO increaseQuantity(Long nguoiDungId, Long gioHangId) {
        GioHang item = validateGioHangAccess(nguoiDungId, gioHangId);
        item.setSoLuong(item.getSoLuong() + 1);
        return gioHangDTOConverter.convertToDTO(gioHangRepo.save(item));
    }

    public GioHangDTO decreaseQuantity(Long nguoiDungId, Long gioHangId) {
        GioHang item = validateGioHangAccess(nguoiDungId, gioHangId);
        if (item.getSoLuong() <= 1) {
            throw new RuntimeException("Số lượng không thể nhỏ hơn 1");
        }
        item.setSoLuong(item.getSoLuong() - 1);
        return gioHangDTOConverter.convertToDTO(gioHangRepo.save(item));
    }

    public GioHangDTO updateQuantity(Long nguoiDungId, Long gioHangId, Integer soLuong) {
        if (soLuong < 1) {
            throw new RuntimeException("Số lượng phải lớn hơn 0");
        }
        GioHang item = validateGioHangAccess(nguoiDungId, gioHangId);
        item.setSoLuong(soLuong);
        return gioHangDTOConverter.convertToDTO(gioHangRepo.save(item));
    }

    public void removeFromCart(Long nguoiDungId, Long gioHangId) {
        GioHang item = validateGioHangAccess(nguoiDungId, gioHangId);
        gioHangRepo.delete(item);
    }

    public void clearCart(Long nguoiDungId) {
        NguoiDung nguoiDung = nguoiDungRepo.findById(nguoiDungId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        gioHangRepo.deleteAllByNguoiDung(nguoiDung);
    }

    public double getTongTienGioHang(Long nguoiDungId) {
        return getGioHangByNguoiDungId(nguoiDungId)
                .stream()
                .mapToDouble(GioHangDTO::getThanhTien)
                .sum();
    }

    public double getTongTietKiem(Long nguoiDungId) {
        return getGioHangByNguoiDungId(nguoiDungId)
                .stream()
                .mapToDouble(GioHangDTO::getTietKiem)
                .sum();
    }

    public GioHangThongKeDTO getThongKeGioHang(Long nguoiDungId) {
        List<GioHangDTO> gioHang = getGioHangByNguoiDungId(nguoiDungId);
        
        double tongTien = gioHang.stream().mapToDouble(GioHangDTO::getThanhTien).sum();
        double tongTietKiem = gioHang.stream().mapToDouble(GioHangDTO::getTietKiem).sum();
        int soLuongMonAn = gioHang.size();
        int tongSoLuong = gioHang.stream().mapToInt(GioHangDTO::getSoLuong).sum();
        
        return new GioHangThongKeDTO(tongTien, tongTietKiem, soLuongMonAn, tongSoLuong);
    }

    private GioHang validateGioHangAccess(Long nguoiDungId, Long gioHangId) {
        NguoiDung nguoiDung = nguoiDungRepo.findById(nguoiDungId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        
        GioHang item = gioHangRepo.findById(gioHangId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy mục giỏ hàng"));
        
        if (!item.getNguoiDung().getId().equals(nguoiDung.getId())) {
            throw new RuntimeException("Không có quyền truy cập mục này");
        }
        
        return item;
    }
}