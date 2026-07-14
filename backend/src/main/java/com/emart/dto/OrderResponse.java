package com.emart.dto;

import com.emart.entity.Order;
import com.emart.entity.OrderItem;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record OrderResponse(
        Long id,
        String orderNumber,
        String status,
        String paymentMode,
        String paymentStatus,
        String paymentTxnId,
        BigDecimal totalAmount,
        BigDecimal discountAmount,
        BigDecimal deliveryCharge,
        String couponCode,
        String rejectReason,
        boolean isDealerOrder,
        Instant createdAt,
        Instant estimatedDeliveryAt,
        // customer details (used by admin order view)
        Long customerId,
        String customerName,
        String customerMobile,
        AddressResponse address,
        List<Line> items
) {
    public record Line(
            Long productId,
            String productName,
            String imageUrl,
            Integer quantity,
            BigDecimal priceAtOrder,
            BigDecimal lineTotal
    ) {
        public static Line from(OrderItem oi) {
            BigDecimal lineTotal = oi.getPriceAtOrder().multiply(BigDecimal.valueOf(oi.getQuantity()));
            return new Line(
                    oi.getProduct().getId(),
                    oi.getProduct().getName(),
                    oi.getProduct().getImageUrl(),
                    oi.getQuantity(),
                    oi.getPriceAtOrder(),
                    lineTotal
            );
        }
    }

    // Prefer the per-order snapshot; fall back to the linked address for legacy orders.
    private static AddressResponse deliveryAddress(Order o) {
        if (o.getDeliveryLine1() != null) {
            Long aid = o.getAddress() != null ? o.getAddress().getId() : null;
            return new AddressResponse(aid, o.getDeliveryLine1(), o.getDeliveryCity(),
                    o.getDeliveryPincode(), o.getDeliveryPhone());
        }
        return o.getAddress() != null ? AddressResponse.from(o.getAddress()) : null;
    }

    public static OrderResponse from(Order o) {
        List<Line> lines = o.getItems().stream().map(Line::from).toList();
        return new OrderResponse(
                o.getId(),
                o.getOrderNumber(),
                o.getStatus().name(),
                o.getPaymentMode().name(),
                o.getPaymentStatus().name(),
                o.getPaymentTxnId(),
                o.getTotalAmount(),
                o.getDiscountAmount() != null ? o.getDiscountAmount() : java.math.BigDecimal.ZERO,
                o.getDeliveryCharge() != null ? o.getDeliveryCharge() : java.math.BigDecimal.ZERO,
                o.getCouponCode(),
                o.getRejectReason(),
                o.isDealerOrder(),
                o.getCreatedAt(),
                o.getCreatedAt() != null
                        ? o.getCreatedAt().plus(2, java.time.temporal.ChronoUnit.DAYS) : null,
                o.getUser().getId(),
                o.getUser().getName(),
                o.getUser().getMobile(),
                deliveryAddress(o),
                lines
        );
    }
}
