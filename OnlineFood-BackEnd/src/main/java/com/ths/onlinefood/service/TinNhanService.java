package com.ths.onlinefood.service;

import com.ths.onlinefood.model.TinNhan;
import com.ths.onlinefood.model.HoiThoai;
import com.ths.onlinefood.model.NguoiDung;
import com.ths.onlinefood.repository.TinNhanRepository;
import com.ths.onlinefood.repository.HoiThoaiRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class TinNhanService {
    
    private final TinNhanRepository tinNhanRepository;
    private final HoiThoaiRepository hoiThoaiRepository;

    public TinNhanService(TinNhanRepository tinNhanRepository, HoiThoaiRepository hoiThoaiRepository) {
        this.tinNhanRepository = tinNhanRepository;
        this.hoiThoaiRepository = hoiThoaiRepository;
    }

    
    public HoiThoai taoHoiThoai(HoiThoai hoiThoai) {
        return hoiThoaiRepository.save(hoiThoai);
    }


    public HoiThoai taoHoiThoaiChoKhachHang(NguoiDung khachHang) {
        Optional<HoiThoai> hoiThoaiOpt = hoiThoaiRepository.findByKhachHangId(khachHang.getId());
        
        if (hoiThoaiOpt.isPresent()) {
            return hoiThoaiOpt.get();
        }
        
       
        HoiThoai hoiThoai = new HoiThoai();
        hoiThoai.setKhachHang(khachHang);
        return hoiThoaiRepository.save(hoiThoai);
    }

   
    public List<HoiThoai> getTatCaHoiThoai() {
        return hoiThoaiRepository.findAll();
    }

  
    public List<HoiThoai> getTatCaHoiThoaiCoTinNhan() {
        return hoiThoaiRepository.findAllWithMessages();
    }

  
    public Optional<HoiThoai> getHoiThoaiByKhachHang(Long khachHangId) {
        return hoiThoaiRepository.findByKhachHangId(khachHangId);
    }

 
    public TinNhan guiTinNhan(TinNhan tinNhan) {
        return tinNhanRepository.save(tinNhan);
    }

  
    public TinNhan luuTinNhan(TinNhan tinNhan) {
        return tinNhanRepository.save(tinNhan);
    }

  
    public List<TinNhan> getTinNhanTheoHoiThoai(Long hoiThoaiId) {
        return tinNhanRepository.findByHoiThoaiIdOrderByThoiGianTaoAsc(hoiThoaiId);
    }

  
    public Optional<HoiThoai> getHoiThoaiById(Long id) {
        return hoiThoaiRepository.findById(id);
    }
}