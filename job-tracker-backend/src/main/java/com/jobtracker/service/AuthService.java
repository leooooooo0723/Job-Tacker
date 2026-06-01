package com.jobtracker.service;

import com.jobtracker.dto.request.LoginRequest;
import com.jobtracker.dto.request.RegisterRequest;
import com.jobtracker.entity.mysql.User;
import com.jobtracker.repository.mysql.UserRepository;
import com.jobtracker.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public void register(RegisterRequest req) {
        if (req.getUsername().length() < 2) throw new IllegalArgumentException("用户名至少2个字符");
        if (req.getPassword().length() < 4) throw new IllegalArgumentException("密码至少4个字符");
        if (userRepository.existsByUsername(req.getUsername())) {
            throw new IllegalStateException("用户名已存在");
        }
        User user = User.builder()
                .username(req.getUsername())
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .build();
        userRepository.save(user);
    }

    public Map<String, String> login(LoginRequest req) {
        User user = userRepository.findByUsername(req.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("用户名或密码错误"));
        if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("用户名或密码错误");
        }
        String token = jwtUtil.generateToken(user.getId(), user.getUsername(), user.getRole());
        return Map.of("token", token, "username", user.getUsername(), "role", user.getRole());
    }
}
