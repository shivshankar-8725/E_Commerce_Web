package com.emart.dto;

public record AuthResponse(
        String token,
        Long userId,
        String name,
        String mobile,
        String role
) {}
