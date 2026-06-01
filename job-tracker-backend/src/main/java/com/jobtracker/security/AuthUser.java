package com.jobtracker.security;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AuthUser {
    private String userId;
    private String username;
    private String role;
}
