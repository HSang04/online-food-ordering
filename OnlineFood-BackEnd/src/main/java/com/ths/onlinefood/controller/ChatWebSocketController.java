package com.ths.onlinefood.controller;

import com.ths.onlinefood.model.TinNhan;
import com.ths.onlinefood.service.TinNhanService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {

    private final TinNhanService tinNhanService;

 
    @MessageMapping("/sendMessage")
    @SendTo("/topic/public")
    public TinNhan sendMessage(@Payload TinNhan tinNhan) {
        return tinNhanService.luuTinNhan(tinNhan);
    }
}
