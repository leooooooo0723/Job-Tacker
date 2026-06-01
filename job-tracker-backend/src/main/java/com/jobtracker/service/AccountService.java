package com.jobtracker.service;

import com.jobtracker.dto.request.ChangePasswordRequest;
import com.jobtracker.entity.mysql.User;
import com.jobtracker.repository.mysql.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public Map<String, Object> getAccount(String userId) {
        User user = userRepository.findById(userId).orElseThrow();
        return Map.of(
                "id", user.getId(),
                "username", user.getUsername(),
                "role", user.getRole(),
                "createdAt", user.getCreatedAt().toString()
        );
    }

    public void changePassword(String userId, ChangePasswordRequest req) {
        if (req.getNewPassword() == null || req.getNewPassword().length() < 6) {
            throw new IllegalArgumentException("新密码至少6个字符");
        }
        User user = userRepository.findById(userId).orElseThrow();
        if (!passwordEncoder.matches(req.getOldPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("原密码错误");
        }
        user.setPasswordHash(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(user);
    }

    public void deleteAccount(String userId) {
        userRepository.deleteById(userId);
    }
}
