package com.emart.dto;

import jakarta.validation.constraints.NotBlank;

/** The three values Razorpay returns to the browser on a successful payment. */
public record VerifyPaymentRequest(
        @NotBlank(message = "razorpayPaymentId is required")
        String razorpayPaymentId,

        @NotBlank(message = "razorpayOrderId is required")
        String razorpayOrderId,

        @NotBlank(message = "razorpaySignature is required")
        String razorpaySignature
) {}
