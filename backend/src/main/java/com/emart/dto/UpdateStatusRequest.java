package com.emart.dto;

import com.emart.entity.OrderStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateStatusRequest(
        @NotNull(message = "Status is required")
        OrderStatus status
) {}
