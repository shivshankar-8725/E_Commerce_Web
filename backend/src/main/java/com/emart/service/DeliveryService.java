package com.emart.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

/**
 * Delivery fee rule: a flat charge is added when the order amount is below the free-delivery
 * threshold (e.g. ₹50 when the order is under ₹1000; free at or above).
 */
@Service
public class DeliveryService {

    @Value("${app.delivery.charge:50}")
    private BigDecimal charge;

    @Value("${app.delivery.free-above:1000}")
    private BigDecimal freeAbove;

    /** Returns the delivery charge for a goods amount (after discount). */
    public BigDecimal chargeFor(BigDecimal goodsAmount) {
        if (goodsAmount == null) goodsAmount = BigDecimal.ZERO;
        return goodsAmount.compareTo(freeAbove) < 0 ? charge : BigDecimal.ZERO;
    }

    public BigDecimal getCharge() { return charge; }
    public BigDecimal getFreeAbove() { return freeAbove; }
}
