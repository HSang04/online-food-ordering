package com.ths.onlinefood.controller;

import com.ths.onlinefood.config.JwtProvider;
import com.ths.onlinefood.model.NguoiDung;
import com.ths.onlinefood.model.USER_ROLE;
import com.ths.onlinefood.repository.NguoiDungRepository;
import com.ths.onlinefood.request.RequestLogin;
import com.ths.onlinefood.request.ForgotPasswordRequest;
import com.ths.onlinefood.request.ResetPasswordRequest;
import com.ths.onlinefood.request.VerifyTokenRequest;
import com.ths.onlinefood.response.AuthResponse;
import com.ths.onlinefood.service.CustomerUserDetailsService;
import com.ths.onlinefood.service.NguoiDungService;
import com.ths.onlinefood.dto.NguoiDungDTO;
import com.ths.onlinefood.service.EmailService;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;

import java.util.Collection;
import java.util.Collections;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final NguoiDungRepository nguoiDungRepository;
    private final JwtProvider jwtProvider;
    private final CustomerUserDetailsService customerUserDetailsService;
    private final NguoiDungService nguoiDungService;
    private final EmailService emailService;

    // Lưu trữ token tạm thời trong memory
    private final Map<String, TokenData> tokenStorage = new ConcurrentHashMap<>();

    public AuthController(
            NguoiDungRepository nguoiDungRepository,
            JwtProvider jwtProvider,
            CustomerUserDetailsService customerUserDetailsService,
            NguoiDungService nguoiDungService,
            EmailService emailService
    ) {
        this.nguoiDungRepository = nguoiDungRepository;
        this.jwtProvider = jwtProvider;
        this.customerUserDetailsService = customerUserDetailsService;
        this.nguoiDungService = nguoiDungService;
        this.emailService = emailService;
    }

    @PostMapping("/signup")
    public ResponseEntity<?> createUserHandler(@RequestBody NguoiDungDTO userRequest) {
        try {
            NguoiDung savedUser = nguoiDungService.createUserByPublic(userRequest);

            String jwt = generateJwtForUser(savedUser);

            AuthResponse authResponse = new AuthResponse();
            authResponse.setJwt(jwt);
            authResponse.setMessage("Đăng ký thành công");
            authResponse.setRole(savedUser.getVaiTro());
            authResponse.setId(savedUser.getId());

            return new ResponseEntity<>(authResponse, HttpStatus.CREATED);
        } catch (Exception e) {
            return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(Collections.singletonMap("message", e.getMessage()));
        }
    }

    @PostMapping("/signup-by-admin")
    public ResponseEntity<?> createUserByAdmin(@RequestBody NguoiDungDTO userRequest) {
        try {
            NguoiDung savedUser = nguoiDungService.createUserByAdmin(userRequest);

            String jwt = generateJwtForUser(savedUser);

            AuthResponse authResponse = new AuthResponse();
            authResponse.setJwt(jwt);
            authResponse.setMessage("Đăng ký thành công");
            authResponse.setRole(savedUser.getVaiTro());
            authResponse.setId(savedUser.getId());

            return new ResponseEntity<>(authResponse, HttpStatus.CREATED);
        } catch (Exception e) {
            return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(Collections.singletonMap("message", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> signin(@RequestBody RequestLogin requestLogin) {
        try {
            Authentication authentication = authenticate(
                requestLogin.getUsername(), 
                requestLogin.getMatKhau()
            );

            // Sử dụng service thay vì repository trực tiếp
            Optional<NguoiDung> nguoiDungOpt = nguoiDungService.getByUsername(requestLogin.getUsername());
            if (nguoiDungOpt.isEmpty()) {
                throw new UsernameNotFoundException("Không tìm thấy người dùng");
            }
            
            NguoiDung nguoiDung = nguoiDungOpt.get();

            if (!nguoiDung.getTrangThai()) {
                return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body(Collections.singletonMap("message", "Tài khoản đã bị vô hiệu hóa."));
            }

            String jwt = jwtProvider.generateToken(authentication);
            Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();
            String role = authorities.isEmpty() ? null : authorities.iterator().next().getAuthority();

            AuthResponse response = new AuthResponse();
            response.setJwt(jwt);
            response.setId(nguoiDung.getId());
            response.setRole(USER_ROLE.valueOf(role));
            response.setMessage("Đăng nhập thành công");

            return ResponseEntity.ok(response);

        } catch (BadCredentialsException | UsernameNotFoundException ex) {
            return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(Collections.singletonMap("message", "Tài khoản hoặc mật khẩu không chính xác."));
        } catch (Exception e) {
            return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Collections.singletonMap("message", "Lỗi hệ thống"));
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        try {
            // Sử dụng service để tìm user và validate
            NguoiDung nguoiDung = nguoiDungService.findByEmailForPasswordReset(request.getEmail());
            
            // Tạo token reset password
            String resetToken = UUID.randomUUID().toString();
            
            // Lưu token vào memory với thời gian hết hạn 15 phút
            TokenData tokenData = new TokenData(nguoiDung.getId(), LocalDateTime.now().plusMinutes(15));
            tokenStorage.put(resetToken, tokenData);

            // Dọn dẹp token hết hạn
            cleanExpiredTokens();

            // Gửi email
            emailService.sendResetPasswordEmail(nguoiDung.getEmail(), resetToken);

            return ResponseEntity.ok(Collections.singletonMap("message", 
                "Email khôi phục mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư của bạn."));

        } catch (RuntimeException e) {
            return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(Collections.singletonMap("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Collections.singletonMap("message", "Lỗi hệ thống: " + e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        try {
            // Kiểm tra token có tồn tại không
            TokenData tokenData = tokenStorage.get(request.getToken());
            
            if (tokenData == null) {
                return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Collections.singletonMap("message", "Token không hợp lệ."));
            }

            if (tokenData.getExpiryTime().isBefore(LocalDateTime.now())) {
                tokenStorage.remove(request.getToken()); // Xóa token hết hạn
                return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Collections.singletonMap("message", "Token đã hết hạn."));
            }

            
            nguoiDungService.resetPasswordByToken(tokenData.getUserId(), request.getNewPassword());
            tokenStorage.remove(request.getToken());

            return ResponseEntity.ok(Collections.singletonMap("message", 
                "Mật khẩu đã được thay đổi thành công."));

        } catch (RuntimeException e) {
            return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(Collections.singletonMap("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Collections.singletonMap("message", "Lỗi hệ thống: " + e.getMessage()));
        }
    }

    @PostMapping("/verify-reset-token")
    public ResponseEntity<?> verifyResetToken(@RequestBody VerifyTokenRequest request) {
        try {
            TokenData tokenData = tokenStorage.get(request.getToken());
            
            if (tokenData == null) {
                return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Collections.singletonMap("message", "Token không hợp lệ."));
            }

            // Kiểm tra token có hết hạn không
            if (tokenData.getExpiryTime().isBefore(LocalDateTime.now())) {
                tokenStorage.remove(request.getToken()); // Xóa token hết hạn
                return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Collections.singletonMap("message", "Token đã hết hạn."));
            }

            return ResponseEntity.ok(Collections.singletonMap("message", "Token hợp lệ."));

        } catch (Exception e) {
            return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Collections.singletonMap("message", "Lỗi hệ thống: " + e.getMessage()));
        }
    }

    private Authentication authenticate(String username, String password) {
        UserDetails userDetails = customerUserDetailsService.loadUserByUsername(username);
        if (userDetails == null) {
            throw new BadCredentialsException("Tài khoản không tồn tại.");
        }

        if (!nguoiDungService.checkPassword(password, userDetails.getPassword())) {
            throw new BadCredentialsException("Mật khẩu không chính xác.");
        }

        Authentication authentication =
                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(authentication);
        return authentication;
    }

    private String generateJwtForUser(NguoiDung user) {
        UserDetails userDetails = customerUserDetailsService.loadUserByUsername(user.getUsername());
        UsernamePasswordAuthenticationToken authToken =
                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(authToken);
        
        return jwtProvider.generateToken(authToken);
    }

   
    private void cleanExpiredTokens() {
        LocalDateTime now = LocalDateTime.now();
        tokenStorage.entrySet().removeIf(entry -> entry.getValue().getExpiryTime().isBefore(now));
    }

  
    private static class TokenData {
        private final Long userId;
        private final LocalDateTime expiryTime;

        public TokenData(Long userId, LocalDateTime expiryTime) {
            this.userId = userId;
            this.expiryTime = expiryTime;
        }

        public Long getUserId() {
            return userId;
        }

        public LocalDateTime getExpiryTime() {
            return expiryTime;
        }
    }
}