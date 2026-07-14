package com.emart.dto;

import jakarta.validation.constraints.NotBlank;

public record RejectDealerRequest(
        @NotBlank(message = "Rejection reason is required")
        String reason
) {}
