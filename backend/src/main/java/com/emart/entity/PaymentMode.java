package com.emart.entity;

public enum PaymentMode {
    COD,
    ONLINE,
    // Customer pays by scanning a UPI QR code, then the order is placed as PENDING
    // and confirmed manually by the admin (no payment gateway involved).
    UPI_QR
}
