package com.emart.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record AddressRequest(
        @NotBlank(message = "Address line is required")
        String line1,

        @NotBlank(message = "City is required")
        String city,

        @NotBlank(message = "Pincode is required")
        @Pattern(regexp = "\\d{6}", message = "Pincode must be exactly 6 digits")
        String pincode,

        @NotBlank(message = "Phone number is required")
        @Pattern(regexp = "\\d{10}", message = "Phone number must be exactly 10 digits")
        String phone
) {}
