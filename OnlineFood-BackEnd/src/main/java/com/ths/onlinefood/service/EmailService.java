package com.ths.onlinefood.service;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendResetPasswordEmail(String toEmail, String token) {
        String resetUrl = "http://localhost:3000/reset-password?token=" + token;

       SimpleMailMessage message = new SimpleMailMessage();
       message.setTo(toEmail);
       message.setSubject("Yêu cầu đặt lại mật khẩu");
       message.setText("Xin chào,\n\nBạn vừa yêu cầu đặt lại mật khẩu." +
                "\nHãy nhấn vào link sau để đổi mật khẩu: " + resetUrl +
                "\n\nLink này có hiệu lực trong 15 phút." +
                "\n\nNếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này." +
                "\nTrong trường hợp bạn liên tục nhận được email mà không phải do bạn yêu cầu, vui lòng liên hệ: 2251010079sang@ou.edu.vn để được hỗ trợ." +
                "\n\nChúng tôi xin lỗi vì sự bất tiện này và cảm ơn bạn đã thông cảm.");

        mailSender.send(message);
    }
}
