package com.emart.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record PincodeRequest(
        @NotBlank(message = "Pincode is required")
        @Pattern(regexp = "\\d{6}", message = "Pincode must be exactly 6 digits")
        String pincode,

        String area,

        Boolean isActive
) {}
