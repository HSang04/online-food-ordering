package com.ths.onlinefood.controller;

import com.ths.onlinefood.dto.TinNhanDTO;
import com.ths.onlinefood.response.ChatCustomerResponseDTO;
import com.ths.onlinefood.response.ChatAdminResponseDTO;
import com.ths.onlinefood.model.HoiThoai;
import com.ths.onlinefood.model.TinNhan;
import com.ths.onlinefood.model.NguoiDung;
import com.ths.onlinefood.model.USER_ROLE;
import com.ths.onlinefood.service.TinNhanService;
import com.ths.onlinefood.service.NguoiDungService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/tin-nhan")
@CrossOrigin(origins = "*")
public class TinNhanController {
    
    private final TinNhanService tinNhanService;
    private final NguoiDungService nguoiDungService;

    public TinNhanController(TinNhanService tinNhanService, NguoiDungService nguoiDungService) {
        this.tinNhanService = tinNhanService;
        this.nguoiDungService = nguoiDungService;
    }

    @GetMapping("/chat")
    public ResponseEntity<?> getChatForCustomer() {
        try {
           
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();
            
            Optional<NguoiDung> nguoiDungOpt = nguoiDungService.getByUsername(username);
            if (!nguoiDungOpt.isPresent()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Không tìm thấy thông tin người dùng");
            }
            
            NguoiDung nguoiDung = nguoiDungOpt.get();
            
           
            if (!USER_ROLE.KHACHHANG.equals(nguoiDung.getVaiTro())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Chỉ khách hàng mới có thể truy cập endpoint này");
            }
            

            HoiThoai hoiThoai = tinNhanService.taoHoiThoaiChoKhachHang(nguoiDung);

            List<TinNhan> tinNhanList = tinNhanService.getTinNhanTheoHoiThoai(hoiThoai.getId());
            
            ChatCustomerResponseDTO response = new ChatCustomerResponseDTO(hoiThoai, tinNhanList);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Lỗi hệ thống: " + e.getMessage());
        }
    }

  
    @GetMapping("/chat/{idNguoiDung}")
    public ResponseEntity<?> getChatWithCustomer(@PathVariable Long idNguoiDung) {
        try {
         
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();
            
            Optional<NguoiDung> currentUserOpt = nguoiDungService.getByUsername(username);
            if (!currentUserOpt.isPresent()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Không tìm thấy thông tin người dùng");
            }
            
            NguoiDung currentUser = currentUserOpt.get();
            
           
            if (USER_ROLE.KHACHHANG.equals(currentUser.getVaiTro())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Khách hàng không thể truy cập endpoint này");
            }
            
      
            Optional<NguoiDung> khachHangOpt = nguoiDungService.getById(idNguoiDung);
            if (!khachHangOpt.isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Không tìm thấy khách hàng");
            }
            
            NguoiDung khachHang = khachHangOpt.get();
            
           
            if (!USER_ROLE.KHACHHANG.equals(khachHang.getVaiTro())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("ID được cung cấp không phải là khách hàng");
            }
            
         
            Optional<HoiThoai> hoiThoaiOpt = tinNhanService.getHoiThoaiByKhachHang(idNguoiDung);
            if (!hoiThoaiOpt.isPresent()) {
                ChatAdminResponseDTO response = new ChatAdminResponseDTO(null, List.of(), khachHang);
                return ResponseEntity.ok(response);
            }
            
            HoiThoai hoiThoai = hoiThoaiOpt.get();
            List<TinNhan> tinNhanList = tinNhanService.getTinNhanTheoHoiThoai(hoiThoai.getId());
            
            ChatAdminResponseDTO response = new ChatAdminResponseDTO(hoiThoai, tinNhanList, khachHang);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Lỗi hệ thống: " + e.getMessage());
        }
    }


    @GetMapping("/hoi-thoai/all")
    public ResponseEntity<?> getAllConversations() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();
            
            Optional<NguoiDung> currentUserOpt = nguoiDungService.getByUsername(username);
            if (!currentUserOpt.isPresent()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Không tìm thấy thông tin người dùng");
            }
            
            NguoiDung currentUser = currentUserOpt.get();
            

            if (USER_ROLE.KHACHHANG.equals(currentUser.getVaiTro())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Khách hàng không thể truy cập endpoint này");
            }
            
            List<HoiThoai> hoiThoaiList = tinNhanService.getTatCaHoiThoaiCoTinNhan();
            return ResponseEntity.ok(hoiThoaiList);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Lỗi hệ thống: " + e.getMessage());
        }
    }

  
    @PostMapping("/gui")
    public ResponseEntity<?> guiTinNhan(@RequestBody TinNhanDTO tinNhanDTO) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();
            
            Optional<NguoiDung> nguoiDungOpt = nguoiDungService.getByUsername(username);
            if (!nguoiDungOpt.isPresent()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Không tìm thấy thông tin người dùng");
            }
            
            NguoiDung nguoiDung = nguoiDungOpt.get();
         
            if (USER_ROLE.KHACHHANG.equals(nguoiDung.getVaiTro())) {
             
                Optional<HoiThoai> hoiThoaiOpt = tinNhanService.getHoiThoaiByKhachHang(nguoiDung.getId());
                if (!hoiThoaiOpt.isPresent() || !hoiThoaiOpt.get().getId().equals(tinNhanDTO.getHoiThoaiId())) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Bạn chỉ có thể gửi tin nhắn trong hội thoại của mình");
                }
            }
            
            TinNhan tinNhan = new TinNhan();
            tinNhan.setNguoiGuiId(nguoiDung.getId());
            tinNhan.setVaiTroNguoiGui(nguoiDung.getVaiTro());
            tinNhan.setNoiDung(tinNhanDTO.getNoiDung());
            
          
            Optional<HoiThoai> hoiThoaiOpt = tinNhanService.getHoiThoaiById(tinNhanDTO.getHoiThoaiId());
            if (!hoiThoaiOpt.isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Không tìm thấy hội thoại");
            }
            
            tinNhan.setHoiThoai(hoiThoaiOpt.get());
            
            TinNhan savedTinNhan = tinNhanService.guiTinNhan(tinNhan);
            return ResponseEntity.ok(savedTinNhan);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Lỗi hệ thống: " + e.getMessage());
        }
    }

//    // WebSocket endpoint (giữ nguyên)
//    @PostMapping
//    public ResponseEntity<TinNhan> luuTinNhan(@RequestBody TinNhan tinNhan) {
//        return ResponseEntity.ok(tinNhanService.guiTinNhan(tinNhan));
//    }

    @GetMapping("/hoi-thoai/{hoiThoaiId}")
    public ResponseEntity<List<TinNhan>> getTinNhanTheoHoiThoai(@PathVariable Long hoiThoaiId) {
        return ResponseEntity.ok(tinNhanService.getTinNhanTheoHoiThoai(hoiThoaiId));
    }
}