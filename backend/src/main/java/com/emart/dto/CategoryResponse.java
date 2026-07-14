package com.emart.dto;

import com.emart.entity.Category;

public record CategoryResponse(
        Long id,
        String name,
        boolean isActive
) {
    public static CategoryResponse from(Category c) {
        return new CategoryResponse(c.getId(), c.getName(), c.isActive());
    }
}
