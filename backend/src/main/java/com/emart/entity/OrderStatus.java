package com.emart.entity;

public enum OrderStatus {
    PLACED,
    ACCEPTED,
    PACKED,
    OUT_FOR_DELIVERY,
    DELIVERED,
    REJECTED,
    CANCELLED   // cancelled by the customer before dispatch
}
