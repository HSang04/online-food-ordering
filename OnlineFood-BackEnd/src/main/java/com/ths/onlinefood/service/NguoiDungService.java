package com.ths.onlinefood.service;

import com.ths.onlinefood.request.ChangePasswordRequest;
import com.ths.onlinefood.request.PasswordVerificationRequest;
import com.ths.onlinefood.dto.NguoiDungDTO;
import com.ths.onlinefood.model.NguoiDung;
import com.ths.onlinefood.model.USER_ROLE;
import com.ths.onlinefood.repository.NguoiDungRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class NguoiDungService {
    
    private final NguoiDungRepository nguoiDungRepository;
    private final PasswordEncoder passwordEncoder;
    
    public List<NguoiDung> getAll() {
        return nguoiDungRepository.findByTrangThaiTrue();
    }
    
    public List<NguoiDung> findByTrangThaiFalse() {
        return nguoiDungRepository.findByTrangThaiFalse();
    }

    public Optional<NguoiDung> getById(Long id) {
        return nguoiDungRepository.findById(id);
    }
   
    public Optional<NguoiDung> getByUsername(String username) {
        return nguoiDungRepository.findByUsername(username);
    }
    
    public NguoiDung createUserByPublic(NguoiDungDTO userRequest) throws Exception {
        Optional<NguoiDung> existingUsername = nguoiDungRepository.findByUsername(userRequest.getUsername());
        if (existingUsername.isPresent()) {
            throw new Exception("Username đã được sử dụng.");
        }
        
        Optional<NguoiDung> existingEmail = nguoiDungRepository.findByEmail(userRequest.getEmail());
        if (existingEmail.isPresent()) {
            throw new Exception("Email đã được sử dụng.");
        }

        validateUserInput(userRequest);

        NguoiDung newUser = new NguoiDung();
        newUser.setUsername(userRequest.getUsername());
        newUser.setEmail(userRequest.getEmail());
        newUser.setHoTen(userRequest.getHoTen());
        newUser.setVaiTro(USER_ROLE.KHACHHANG);
        newUser.setMatKhau(passwordEncoder.encode(userRequest.getMatKhau()));
        newUser.setSoDienThoai(userRequest.getSoDienThoai());
        newUser.setDiaChi(userRequest.getDiaChi());
        newUser.setNgayTao(LocalDateTime.now());
        newUser.setTrangThai(true); 

        return nguoiDungRepository.save(newUser);
    }

    public NguoiDung createUserByAdmin(NguoiDungDTO userRequest) throws Exception {
        Optional<NguoiDung> existingUsername = nguoiDungRepository.findByUsername(userRequest.getUsername());
        if (existingUsername.isPresent()) {
            throw new Exception("Username đã được sử dụng.");
        }
        
        Optional<NguoiDung> existingEmail = nguoiDungRepository.findByEmail(userRequest.getEmail());
        if (existingEmail.isPresent()) {
            throw new Exception("Email đã được sử dụng.");
        }

        validateUserInput(userRequest);

        if (userRequest.getVaiTro() == null) {
            throw new Exception("Vai trò không được để trống.");
        }

        NguoiDung newUser = new NguoiDung();
        newUser.setUsername(userRequest.getUsername());
        newUser.setEmail(userRequest.getEmail());
        newUser.setHoTen(userRequest.getHoTen());
        newUser.setVaiTro(userRequest.getVaiTro());
        newUser.setMatKhau(passwordEncoder.encode(userRequest.getMatKhau()));
        newUser.setSoDienThoai(userRequest.getSoDienThoai());
        newUser.setDiaChi(userRequest.getDiaChi());
        newUser.setNgayTao(LocalDateTime.now());
        newUser.setTrangThai(true);

        return nguoiDungRepository.save(newUser);
    }

    private void validateUserInput(NguoiDungDTO userRequest) throws Exception {
        if (!StringUtils.hasText(userRequest.getUsername())) {
            throw new Exception("Username không được để trống.");
        }
        if (!StringUtils.hasText(userRequest.getEmail())) {
            throw new Exception("Email không được để trống.");
        }
        if (!StringUtils.hasText(userRequest.getMatKhau())) {
            throw new Exception("Mật khẩu không được để trống.");
        }
        if (userRequest.getMatKhau().length() < 6) {
            throw new Exception("Mật khẩu phải có ít nhất 6 ký tự.");
        }
        if (!StringUtils.hasText(userRequest.getHoTen())) {
            throw new Exception("Họ tên không được để trống.");
        }
        
        if (!isValidEmail(userRequest.getEmail())) {
            throw new Exception("Định dạng email không hợp lệ.");
        }
    }

    private boolean isValidEmail(String email) {
        return email.matches("^[A-Za-z0-9+_.-]+@(.+)$");
    }

    public boolean checkPassword(String rawPassword, String encodedPassword) {
        return passwordEncoder.matches(rawPassword, encodedPassword);
    }
    
    public NguoiDung create(NguoiDung nguoiDung) {
        nguoiDung.setMatKhau(passwordEncoder.encode(nguoiDung.getMatKhau())); 
        nguoiDung.setNgayTao(LocalDateTime.now());
        nguoiDung.setTrangThai(true);
        return nguoiDungRepository.save(nguoiDung);
    }
    
    public NguoiDung update(Long id, NguoiDung nguoiDungMoi) {
        return nguoiDungRepository.findById(id)
                .map(nd -> {
                    nd.setHoTen(nguoiDungMoi.getHoTen());
                    nd.setSoDienThoai(nguoiDungMoi.getSoDienThoai());
                    nd.setDiaChi(nguoiDungMoi.getDiaChi());
                    return nguoiDungRepository.save(nd);
                })
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
    }
   
    public NguoiDungDTO updateProfile(Long id, NguoiDungDTO updateRequest, String currentUsername) {
        return nguoiDungRepository.findById(id)
                .map(existingUser -> {
                    if (!existingUser.getUsername().equals(currentUsername)) {
                        throw new RuntimeException("Không có quyền cập nhật thông tin này");
                    }
                  
                    if (StringUtils.hasText(updateRequest.getHoTen())) {
                        existingUser.setHoTen(updateRequest.getHoTen());
                    }
                    if (StringUtils.hasText(updateRequest.getSoDienThoai())) {
                        existingUser.setSoDienThoai(updateRequest.getSoDienThoai());
                    }
                    if (StringUtils.hasText(updateRequest.getDiaChi())) {
                        existingUser.setDiaChi(updateRequest.getDiaChi());
                    }
                    
                    NguoiDung savedUser = nguoiDungRepository.save(existingUser);
                    
                    return new NguoiDungDTO(
                        savedUser.getId(),
                        savedUser.getUsername(),
                        null, 
                        savedUser.getHoTen(),
                        savedUser.getEmail(),
                        savedUser.getSoDienThoai(),
                        savedUser.getDiaChi(),
                        savedUser.getVaiTro()
                    );
                })
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
    }
    
    public void changePassword(Long id, ChangePasswordRequest request, String currentUsername) {
        NguoiDung user = nguoiDungRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        
        if (!user.getUsername().equals(currentUsername)) {
            throw new RuntimeException("Không có quyền thay đổi mật khẩu này");
        }
        
        if (!StringUtils.hasText(request.getMatKhauCu())) {
            throw new RuntimeException("Vui lòng nhập mật khẩu cũ");
        }
        
        if (!StringUtils.hasText(request.getMatKhauMoi())) {
            throw new RuntimeException("Vui lòng nhập mật khẩu mới");
        }
        
        if (request.getMatKhauMoi().length() < 6) {
            throw new RuntimeException("Mật khẩu mới phải có ít nhất 6 ký tự");
        }
        
        if (!passwordEncoder.matches(request.getMatKhauCu(), user.getMatKhau())) {
            throw new RuntimeException("Mật khẩu cũ không chính xác");
        }
        
        user.setMatKhau(passwordEncoder.encode(request.getMatKhauMoi()));
        nguoiDungRepository.save(user);
    }

      public void updatePassword(Long userId, String newPassword) {
        Optional<NguoiDung> nguoiDungOpt = nguoiDungRepository.findById(userId);
        if (nguoiDungOpt.isPresent()) {
            NguoiDung nguoiDung = nguoiDungOpt.get();
            nguoiDung.setMatKhau(passwordEncoder.encode(newPassword));
            nguoiDungRepository.save(nguoiDung);
        }
    }
    
    // Vô hiệu hóa tài khoản với xác thực mật khẩu (cho user tự thực hiện)
    public void deactivateAccountWithPassword(Long id, PasswordVerificationRequest request, String currentUsername) {
        NguoiDung user = nguoiDungRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        
        if (!user.getUsername().equals(currentUsername)) {
            throw new RuntimeException("Không có quyền vô hiệu hóa tài khoản này");
        }
        
        if (!StringUtils.hasText(request.getMatKhau())) {
            throw new RuntimeException("Vui lòng nhập mật khẩu để xác nhận");
        }
        
        if (!passwordEncoder.matches(request.getMatKhau(), user.getMatKhau())) {
            throw new RuntimeException("Mật khẩu không chính xác");
        }
        
        user.setTrangThai(false);
        nguoiDungRepository.save(user);
    }

    // Xóa tài khoản với xác thực mật khẩu (cho user tự thực hiện)  
    public void deleteAccountWithPassword(Long id, PasswordVerificationRequest request, String currentUsername) {
        NguoiDung user = nguoiDungRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        
        if (!user.getUsername().equals(currentUsername)) {
            throw new RuntimeException("Không có quyền xóa tài khoản này");
        }
        
        if (!StringUtils.hasText(request.getMatKhau())) {
            throw new RuntimeException("Vui lòng nhập mật khẩu để xác nhận");
        }
        
        if (!passwordEncoder.matches(request.getMatKhau(), user.getMatKhau())) {
            throw new RuntimeException("Mật khẩu không chính xác");
        }
        
        // Soft delete - thay đổi thông tin thành "đã xóa"
        user.setUsername("Đã xóa _ " + id);
        user.setHoTen("Đã xóa");
        user.setEmail("Đã xóa _ " + id + "@deleted.com");
        user.setSoDienThoai("Đã xóa _ " + id);
        user.setDiaChi("Đã xóa");
        user.setMatKhau("deleted");
        user.setTrangThai(false);
        
        nguoiDungRepository.save(user);
    }
    
    public void delete(Long id) {
        nguoiDungRepository.deleteById(id);
    }
    
    public NguoiDung adminUpdate(Long id, NguoiDung nguoiDungRequest) {
        NguoiDung existingUser = nguoiDungRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID: " + id));

        existingUser.setHoTen(nguoiDungRequest.getHoTen());
        existingUser.setEmail(nguoiDungRequest.getEmail());
        existingUser.setSoDienThoai(nguoiDungRequest.getSoDienThoai());
        existingUser.setDiaChi(nguoiDungRequest.getDiaChi());
        existingUser.setVaiTro(nguoiDungRequest.getVaiTro());

        if (nguoiDungRequest.getMatKhau() != null && !nguoiDungRequest.getMatKhau().trim().isEmpty()) {
            existingUser.setMatKhau(passwordEncoder.encode(nguoiDungRequest.getMatKhau()));
        }

        return nguoiDungRepository.save(existingUser);
    }
    
    public void voHieuHoaNguoiDung(Long id) {
        NguoiDung user = nguoiDungRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        user.setTrangThai(false); 
        nguoiDungRepository.save(user);
    }
    
    public void kichHoatNguoiDung(Long id) {
        NguoiDung user = nguoiDungRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        user.setTrangThai(true); 
        nguoiDungRepository.save(user);
    }
    
    public void xoaNguoiDung(Long id) {
        NguoiDung user = nguoiDungRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        
        user.setUsername("Đã xóa _ " + id);
        user.setHoTen("Đã xóa");
        user.setEmail("Đã xóa _ " + id + "@ deleted.com");
        user.setSoDienThoai("Đã xóa _ " + id);
        user.setDiaChi("Đã xóa");
        user.setMatKhau("deleted"); 
        user.setTrangThai(false);
        
        nguoiDungRepository.save(user);
    }
    
    public NguoiDung findByEmailForPasswordReset(String email) {
        if (!StringUtils.hasText(email)) {
            throw new RuntimeException("Email không được để trống.");
        }

        Optional<NguoiDung> nguoiDungOpt = nguoiDungRepository.findByEmail(email);

        if (nguoiDungOpt.isEmpty()) {
            throw new RuntimeException("Email không tồn tại trong hệ thống.");
        }

        NguoiDung nguoiDung = nguoiDungOpt.get();

     
        if (!nguoiDung.getTrangThai()) {
            throw new RuntimeException("Tài khoản đã bị vô hiệu hóa.");
        }

        return nguoiDung;
    }

   
    public void resetPasswordByToken(Long userId, String newPassword) {
        
        if (!StringUtils.hasText(newPassword)) {
            throw new RuntimeException("Mật khẩu mới không được để trống.");
        }

        if (newPassword.length() < 6) {
            throw new RuntimeException("Mật khẩu phải có ít nhất 6 ký tự.");
        }

    
        Optional<NguoiDung> nguoiDungOpt = nguoiDungRepository.findById(userId);
        if (nguoiDungOpt.isPresent()) {
            NguoiDung nguoiDung = nguoiDungOpt.get();

          
            if (!nguoiDung.getTrangThai()) {
                throw new RuntimeException("Tài khoản đã bị vô hiệu hóa.");
            }

            nguoiDung.setMatKhau(passwordEncoder.encode(newPassword));
            nguoiDungRepository.save(nguoiDung);
        } else {
            throw new RuntimeException("Không tìm thấy người dùng.");
        }
    }
}