package com.emart.dto;

import java.math.BigDecimal;

public record ApplyCouponResponse(
        String code,
        String discountType,
        BigDecimal discountValue,
        BigDecimal discountAmount,
        BigDecimal grossTotal,
        BigDecimal netTotal,
        String message
) {}
