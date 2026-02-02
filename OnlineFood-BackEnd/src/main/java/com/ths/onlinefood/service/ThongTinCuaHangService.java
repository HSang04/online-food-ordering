package com.ths.onlinefood.service;

import com.ths.onlinefood.model.ThongTinCuaHang;
import com.ths.onlinefood.repository.ThongTinCuaHangRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class ThongTinCuaHangService {

    private final ThongTinCuaHangRepository repository;
    private final GeoLocationService geoLocationService;

    private static final ZoneId VIETNAM_TIMEZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private LocalTime getCurrentTimeInVietnam() {
        return ZonedDateTime.now(VIETNAM_TIMEZONE).toLocalTime();
    }

    public Optional<ThongTinCuaHang> getCuaHang() {
        return repository.findCuaHang();
    }

    /**
     * Cập nhật thông tin cửa hàng
     * - Ưu tiên tọa độ nhập trực tiếp
     * - Chỉ geocode khi địa chỉ thay đổi
     */
    public ThongTinCuaHang updateCuaHang(ThongTinCuaHang cuaHangMoi) {

        ThongTinCuaHang cuaHang = repository.findCuaHang()
                .orElseGet(ThongTinCuaHang::new);

        boolean isNew = cuaHang.getId() == null;

        /* ========= VALIDATION ========= */

        if (isBlank(cuaHangMoi.getTen())) {
            throw new IllegalArgumentException("Ten cua hang khong duoc de trong");
        }
        if (isBlank(cuaHangMoi.getDiaChi())) {
            throw new IllegalArgumentException("Dia chi khong duoc de trong");
        }
        if (isBlank(cuaHangMoi.getSoDienThoai())) {
            throw new IllegalArgumentException("So dien thoai khong duoc de trong");
        }
        if (cuaHangMoi.getGioMoCua() == null || cuaHangMoi.getGioDongCua() == null) {
            throw new IllegalArgumentException("Gio mo cua va dong cua khong duoc de trong");
        }
        if (cuaHangMoi.getGioMoCua().isAfter(cuaHangMoi.getGioDongCua())) {
            throw new IllegalArgumentException("Gio mo cua phai truoc gio dong cua");
        }

        /* ========= UPDATE BASIC INFO ========= */

        boolean diaChiThayDoi = isNew
                || cuaHang.getDiaChi() == null
                || !cuaHang.getDiaChi().equalsIgnoreCase(cuaHangMoi.getDiaChi());

        boolean coToaDoTrucTiep =
                cuaHangMoi.getViDo() != null && cuaHangMoi.getKinhDo() != null;

        cuaHang.setTen(cuaHangMoi.getTen().trim());
        cuaHang.setDiaChi(cuaHangMoi.getDiaChi().trim());
        cuaHang.setSoDienThoai(cuaHangMoi.getSoDienThoai().trim());
        cuaHang.setGioMoCua(cuaHangMoi.getGioMoCua());
        cuaHang.setGioDongCua(cuaHangMoi.getGioDongCua());

        /* ========= HANDLE LOCATION ========= */

        if (coToaDoTrucTiep) {
            // Ưu tiên tọa độ nhập tay
            System.out.println("[LOCATION] Su dung toa do nhap truc tiep");
            cuaHang.setViDo(cuaHangMoi.getViDo());
            cuaHang.setKinhDo(cuaHangMoi.getKinhDo());

        } else if (diaChiThayDoi) {
            // Địa chỉ đổi → geocode
            try {
                System.out.println("[LOCATION] Geocoding dia chi: " + cuaHangMoi.getDiaChi());
                double[] toaDo = geoLocationService.getLatLngFromAddress(cuaHangMoi.getDiaChi());

                cuaHang.setViDo(toaDo[0]);
                cuaHang.setKinhDo(toaDo[1]);

            } catch (RuntimeException e) {
                // Geocoding fail → trả lỗi rõ ràng cho FE
                throw new IllegalArgumentException(
                        "Khong the lay toa do tu dia chi. "
                                + "Vui long nhap truc tiep Vi do va Kinh do.",
                        e
                );
            }
        }
        // else: địa chỉ không đổi & không nhập tọa độ → giữ nguyên

        return repository.save(cuaHang);
    }

    public boolean isCuaHangMo() {
        return repository.isCuaHangMo(getCurrentTimeInVietnam());
    }

    public String getTrangThaiCuaHang() {
        return getCuaHang()
                .map(ThongTinCuaHang::getTrangThaiInfo)
                .orElse("Chua co thong tin cua hang");
    }

    public ThongTinCuaHang getCuaHangStatus() {
        return getCuaHang().orElseGet(() -> {
            ThongTinCuaHang ch = new ThongTinCuaHang();
            ch.setTen("Chua co thong tin cua hang");
            return ch;
        });
    }

    public Optional<ThongTinCuaHang> getCuaHangStatusOptional() {
        return getCuaHang();
    }

    private boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }
}
