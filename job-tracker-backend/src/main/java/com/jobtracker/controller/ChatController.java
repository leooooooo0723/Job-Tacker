package com.jobtracker.controller;

import com.jobtracker.dto.request.ChatRequest;
import com.jobtracker.entity.mysql.ChatMessage;
import com.jobtracker.security.AuthUser;
import com.jobtracker.service.ChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @GetMapping
    public List<ChatMessage> getHistory(@AuthenticationPrincipal AuthUser user) {
        return chatService.getHistory(user.getUserId());
    }

    @PostMapping
    public ResponseEntity<?> chat(@AuthenticationPrincipal AuthUser user,
                                   @RequestBody ChatRequest req) {
        if (req.getMessage() == null || req.getMessage().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "消息不能为空"));
        }
        try {
            String reply = chatService.chat(user.getUserId(), user.getUsername(), req.getMessage());
            return ResponseEntity.ok(Map.of("text", reply));
        } catch (Exception e) {
            log.error("Chat error", e);
            return ResponseEntity.internalServerError().body(Map.of("error", "出错了：" + e.getMessage()));
        }
    }

    @DeleteMapping
    public ResponseEntity<?> clearHistory(@AuthenticationPrincipal AuthUser user) {
        chatService.clearHistory(user.getUserId());
        return ResponseEntity.ok(Map.of("ok", true));
    }
}
