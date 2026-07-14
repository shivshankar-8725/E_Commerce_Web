package com.emart.dto;

import com.emart.entity.PaymentMode;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record PlaceOrderRequest(
        @NotNull(message = "Delivery address is required")
        Long addressId,

        @NotNull(message = "Payment mode is required")
        PaymentMode paymentMode,

        @NotEmpty(message = "Cart cannot be empty")
        @Valid
        List<Item> items,

        // Optional coupon code (P4-OFFER-01)
        String couponCode
) {
    public record Item(
            @NotNull(message = "Product is required")
            Long productId,

            @NotNull(message = "Quantity is required")
            @Min(value = 1, message = "Quantity must be at least 1")
            Integer quantity
    ) {}
}
