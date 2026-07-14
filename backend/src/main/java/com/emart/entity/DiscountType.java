package com.emart.entity;

public enum DiscountType {
    PERCENT,  // discountValue is a percentage (e.g. 10 = 10% off), optionally capped by maxDiscount
    FLAT      // discountValue is a flat rupee amount off
}
