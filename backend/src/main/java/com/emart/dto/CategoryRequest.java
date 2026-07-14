package com.emart.dto;

import jakarta.validation.constraints.NotBlank;

public record CategoryRequest(
        @NotBlank(message = "Category name is required")
        String name,

        Boolean isActive
) {}
