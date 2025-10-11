package com.ths.onlinefood.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.ths.onlinefood.dto.MonAnDTO;
import com.ths.onlinefood.model.HinhAnhMonAn;
import com.ths.onlinefood.model.MonAn;
import com.ths.onlinefood.repository.HinhAnhMonAnRepository;
import com.ths.onlinefood.repository.MonAnRepository;
import com.ths.onlinefood.repository.ChiTietDonHangRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MonAnService {

    private final MonAnRepository monAnRepository;
    private final HinhAnhMonAnRepository hinhAnhMonAnRepository;
    private final Cloudinary cloudinary;
    private final MonAnDTOConverter monAnDTOConverter;
    private final ChiTietDonHangRepository chiTietDonHangRepository;

    public List<MonAn> getAll() {
        return monAnRepository.findAll();
    }

    public Optional<MonAn> getById(Long id) {
        return monAnRepository.findById(id);
    }

    public MonAn create(MonAn monAn, MultipartFile[] imageFiles) throws IOException {
        MonAn saved = monAnRepository.save(monAn);

        if (imageFiles != null) {
            for (MultipartFile file : imageFiles) {
                Map uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.emptyMap());
                String url = (String) uploadResult.get("secure_url");

                HinhAnhMonAn hinhAnh = new HinhAnhMonAn();
                hinhAnh.setMonAn(saved);
                hinhAnh.setDuongDan(url);

                hinhAnhMonAnRepository.save(hinhAnh);
            }
        }

        return saved;
    }

    public MonAn update(Long id, MonAnDTO dto, MultipartFile[] imageFiles) throws IOException {
        Optional<MonAn> optional = monAnRepository.findById(id);
        if (optional.isEmpty()) return null;

        MonAn existing = optional.get();

        existing.setTenMonAn(dto.getTenMonAn());
        existing.setGia(dto.getGia());
        existing.setMoTa(dto.getMoTa());
        existing.setDanhMuc(dto.getDanhMuc());
        existing.setTrangThai(dto.getTrangThai());

        List<Long> keptIds = dto.getKeptImageIds() != null ? dto.getKeptImageIds() : List.of();
        List<HinhAnhMonAn> oldImages = hinhAnhMonAnRepository.findByMonAnId(id);

        for (HinhAnhMonAn img : oldImages) {
            if (!keptIds.contains(img.getId())) {
                hinhAnhMonAnRepository.delete(img);
            }
        }

        if (imageFiles != null && imageFiles.length > 0) {
            for (MultipartFile file : imageFiles) {
                Map uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.emptyMap());
                String url = (String) uploadResult.get("secure_url");

                HinhAnhMonAn newImage = new HinhAnhMonAn();
                newImage.setMonAn(existing);
                newImage.setDuongDan(url);
                hinhAnhMonAnRepository.save(newImage);
            }
        }

        return monAnRepository.save(existing);
    }

    public boolean delete(Long id) {
        if (monAnRepository.existsById(id)) {
            List<HinhAnhMonAn> images = hinhAnhMonAnRepository.findByMonAnId(id);
            hinhAnhMonAnRepository.deleteAll(images);
            monAnRepository.deleteById(id);
            return true;
        }
        return false;
    }

    public List<MonAn> searchByTenMon(String keyword) {
        return monAnRepository.findByTenMonAnContainingIgnoreCase(keyword);
    }

    public Optional<MonAn> getImagesByMonAnId(Long monAnId) {
        return monAnRepository.findWithHinhAnhMonAnsAndKhuyenMaiById(monAnId);
    }

    public HinhAnhMonAn saveImage(Long monAnId, MultipartFile imageFile) throws IOException {
        Optional<MonAn> monAn = monAnRepository.findById(monAnId);
        if (monAn.isEmpty()) return null;

        Map uploadResult = cloudinary.uploader().upload(imageFile.getBytes(), ObjectUtils.emptyMap());
        String url = (String) uploadResult.get("secure_url");

        HinhAnhMonAn img = new HinhAnhMonAn();
        img.setMonAn(monAn.get());
        img.setDuongDan(url);
        return hinhAnhMonAnRepository.save(img);
    }

    public void deleteImage(Long imageId) {
        hinhAnhMonAnRepository.deleteById(imageId);
    }

 
    public double getGiaBan(MonAn monAn) {
        return monAnDTOConverter.getDisplayPrice(monAn);
    }
    

    public boolean isOnSale(MonAn monAn) {
        return monAnDTOConverter.getSavingAmount(monAn) > 0;
    }

  
    public int getPhanTramGiamGia(MonAn monAn) {
        MonAnDTO dto = monAnDTOConverter.convertToDTO(monAn);
        return dto.getPhanTramGiamGia();
    }
    
  
    public MonAnDTO convertToDto(MonAn monAn) {
        return monAnDTOConverter.convertToDTO(monAn);
    }
    
    public List<MonAnDTO> getAllDTOs() {
       return monAnRepository.findAll()
               .stream()
               .map(monAn -> {
              
                   monAn.getHinhAnhMonAns().size();
                   MonAnDTO dto = monAnDTOConverter.convertToDTO(monAn);

                   int soLuongDaBan = getSoLuongDaBan(monAn.getId());
                   dto.setSoLuongDaBan(soLuongDaBan);

                   return dto;
               })
               .toList();
   }
    
    public List<MonAnDTO> getActiveDTOs() {
        return monAnRepository.findAll()
                .stream()
                .filter(monAn -> monAn.getTrangThai() == 1)
                .map(monAn -> {
                   
                    monAn.getHinhAnhMonAns().size();
                    MonAnDTO dto = monAnDTOConverter.convertToDTO(monAn);

                  
                    int soLuongDaBan = getSoLuongDaBan(monAn.getId());
                    dto.setSoLuongDaBan(soLuongDaBan);

                    return dto;
                })
                .toList();
    }
    
    public Optional<MonAnDTO> getDTOById(Long id) {
        return monAnRepository.findById(id)
                .map(monAnDTOConverter::convertToDTO);
    }
    
    public int getSoLuongDaBan(Long monAnId) {
  
    Integer soLuong = chiTietDonHangRepository.findTotalSoldQuantityByMonAnId(monAnId);
    return soLuong != null ? soLuong : 0;
}

}