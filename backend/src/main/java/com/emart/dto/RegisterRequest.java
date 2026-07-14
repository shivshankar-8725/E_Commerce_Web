package com.emart.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Name is required")
        String name,

        @NotBlank(message = "Mobile number is required")
        @Pattern(regexp = "\\d{10}", message = "Mobile number must be exactly 10 digits")
        String mobile,

        @Size(max = 100, message = "Email is too long")
        String email,

        @NotBlank(message = "Password is required")
        @Size(min = 6, message = "Password must be at least 6 characters")
        String password
) {}
