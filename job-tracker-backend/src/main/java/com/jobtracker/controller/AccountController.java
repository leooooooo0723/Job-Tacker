package com.jobtracker.controller;

import com.jobtracker.dto.request.ChangePasswordRequest;
import com.jobtracker.security.AuthUser;
import com.jobtracker.service.AccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/account")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;

    @GetMapping
    public ResponseEntity<?> getAccount(@AuthenticationPrincipal AuthUser user) {
        return ResponseEntity.ok(accountService.getAccount(user.getUserId()));
    }

    @PutMapping
    public ResponseEntity<?> changePassword(@AuthenticationPrincipal AuthUser user,
                                             @RequestBody ChangePasswordRequest req) {
        try {
            accountService.changePassword(user.getUserId(), req);
            return ResponseEntity.ok(Map.of("ok", true));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping
    public ResponseEntity<?> deleteAccount(@AuthenticationPrincipal AuthUser user) {
        accountService.deleteAccount(user.getUserId());
        return ResponseEntity.ok(Map.of("ok", true));
    }
}
