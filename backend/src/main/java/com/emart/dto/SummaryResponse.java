package com.emart.dto;

import java.math.BigDecimal;

public record SummaryResponse(
        long todayOrderCount,
        BigDecimal todayTotalAmount
) {}
