package com.emart.dto;

/**
 * Data the frontend needs to open the Razorpay checkout. Contains the PUBLIC key id only
 * (the secret never leaves the backend). Amount is in paise (Razorpay's smallest unit).
 */
public record CreatePaymentResponse(
        String keyId,
        String razorpayOrderId,
        long amount,
        String currency,
        String name,
        String description,
        Prefill prefill
) {
    public record Prefill(String name, String email, String contact) {}
}
