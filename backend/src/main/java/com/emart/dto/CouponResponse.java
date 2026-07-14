package com.emart.dto;

import com.emart.entity.Coupon;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CouponResponse(
        Long id,
        String code,
        String description,
        String discountType,
        BigDecimal discountValue,
        BigDecimal maxDiscount,
        BigDecimal minOrderAmount,
        LocalDate validFrom,
        LocalDate validUntil,
        Integer usageLimit,
        int usedCount,
        boolean isActive
) {
    public static CouponResponse from(Coupon c) {
        return new CouponResponse(
                c.getId(), c.getCode(), c.getDescription(),
                c.getDiscountType().name(), c.getDiscountValue(), c.getMaxDiscount(),
                c.getMinOrderAmount(), c.getValidFrom(), c.getValidUntil(),
                c.getUsageLimit(), c.getUsedCount(), c.isActive());
    }
}
