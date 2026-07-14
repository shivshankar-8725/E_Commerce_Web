package com.emart.entity;

public enum PaymentIntentStatus {
    CREATED,   // Razorpay order created, awaiting payment
    PAID,      // payment verified, app order placed
    FAILED     // payment failed / cancelled, no order placed
}
