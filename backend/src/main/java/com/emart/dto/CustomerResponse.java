package com.emart.dto;

import com.emart.entity.User;

import java.time.Instant;

public record CustomerResponse(
        Long id,
        String name,
        String mobile,
        String email,
        Instant createdAt
) {
    public static CustomerResponse from(User u) {
        return new CustomerResponse(u.getId(), u.getName(), u.getMobile(), u.getEmail(), u.getCreatedAt());
    }
}
