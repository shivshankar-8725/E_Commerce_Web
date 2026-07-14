package com.emart.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "Mobile number is required")
        String mobile,

        @NotBlank(message = "Password is required")
        String password
) {}
