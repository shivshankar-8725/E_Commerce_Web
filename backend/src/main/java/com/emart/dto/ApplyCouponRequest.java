package com.emart.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

/** Customer-side: preview a coupon against the current cart. */
public record ApplyCouponRequest(
        @NotBlank(message = "Coupon code is required")
        String code,

        @NotEmpty(message = "Cart cannot be empty")
        @Valid
        List<PlaceOrderRequest.Item> items
) {}
