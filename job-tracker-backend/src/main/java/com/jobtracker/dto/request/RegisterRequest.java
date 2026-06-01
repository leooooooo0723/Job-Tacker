package com.jobtracker.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank @Size(min = 2) private String username;
    @NotBlank @Size(min = 4) private String password;
}
