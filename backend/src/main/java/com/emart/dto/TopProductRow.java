package com.emart.dto;

import java.math.BigDecimal;

/**
 * One row of the "top-selling products" report (P4-RPT-01).
 * Populated directly by a JPQL constructor expression.
 */
public record TopProductRow(
        Long productId,
        String name,
        Long quantitySold,
        BigDecimal revenue
) {}
