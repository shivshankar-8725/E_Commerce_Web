package com.emart.dto;

import com.emart.entity.DiscountType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CouponRequest(
        @NotBlank(message = "Coupon code is required")
        String code,

        String description,

        @NotNull(message = "Discount type is required")
        DiscountType discountType,

        @NotNull(message = "Discount value is required")
        @DecimalMin(value = "0.0", inclusive = false, message = "Discount value must be greater than 0")
        BigDecimal discountValue,

        @DecimalMin(value = "0.0", message = "Max discount cannot be negative")
        BigDecimal maxDiscount,

        @DecimalMin(value = "0.0", message = "Minimum order amount cannot be negative")
        BigDecimal minOrderAmount,

        LocalDate validFrom,
        LocalDate validUntil,

        Integer usageLimit,
        Boolean isActive
) {}
