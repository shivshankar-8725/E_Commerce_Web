package com.emart.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record DealerRegisterRequest(
        @NotBlank(message = "Name is required")
        String name,

        @NotBlank(message = "Mobile number is required")
        @Pattern(regexp = "\\d{10}", message = "Mobile number must be exactly 10 digits")
        String mobile,

        @Size(max = 100, message = "Email is too long")
        String email,

        @NotBlank(message = "Password is required")
        @Size(min = 6, message = "Password must be at least 6 characters")
        String password,

        @NotBlank(message = "Shop name is required")
        String shopName,

        // Contact person at the shop (optional; defaults to the registrant name)
        String contactPerson,

        // GST number is optional but validated when provided
        @Pattern(regexp = "^$|^[0-9A-Z]{15}$", message = "GST number must be 15 characters (letters/digits)")
        String gstNumber
) {}
