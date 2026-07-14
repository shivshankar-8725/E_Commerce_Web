package com.emart.service;

import com.emart.entity.OrderStatus;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Map;

/**
 * P4-NOTI-01: order notifications over SMS.
 *  - Admin is alerted on every new order.
 *  - The customer is alerted whenever their order status changes.
 * Methods are @Async and take plain data (no entities) so they run off the request thread and
 * never touch lazy associations or break the order transaction.
 */
@Service
public class NotificationService {

    private static final Map<OrderStatus, String> STATUS_TEXT = Map.of(
            OrderStatus.PLACED, "Placed",
            OrderStatus.ACCEPTED, "Accepted",
            OrderStatus.PACKED, "Packed",
            OrderStatus.OUT_FOR_DELIVERY, "Out for delivery",
            OrderStatus.DELIVERED, "Delivered",
            OrderStatus.REJECTED, "Rejected"
    );

    private final SmsService smsService;

    @Value("${app.admin.notify-mobile:}")
    private String adminMobile;

    public NotificationService(SmsService smsService) {
        this.smsService = smsService;
    }

    /** Alert the admin/owner that a new order has come in. */
    @Async
    public void notifyAdminNewOrder(String orderNumber, BigDecimal amount,
                                    String customerName, String customerMobile, boolean dealerOrder) {
        if (adminMobile == null || adminMobile.isBlank()) return;
        String who = dealerOrder ? "Dealer " : "";
        String msg = "E-Mart: New " + who + "order " + orderNumber + " for Rs " + amount
                + " from " + customerName + " (" + customerMobile + ").";
        smsService.send(adminMobile, msg);
    }

    /** Alert the customer that their order status changed. */
    @Async
    public void notifyCustomerStatus(String customerMobile, String customerName, String orderNumber,
                                     OrderStatus status, String reason) {
        String label = STATUS_TEXT.getOrDefault(status, status.name());
        StringBuilder msg = new StringBuilder("E-Mart: Hi ")
                .append(firstName(customerName))
                .append(", your order ").append(orderNumber)
                .append(" is now ").append(label).append('.');
        if (status == OrderStatus.REJECTED && reason != null && !reason.isBlank()) {
            msg.append(" Reason: ").append(reason);
        }
        smsService.send(customerMobile, msg.toString());
    }

    private String firstName(String name) {
        if (name == null || name.isBlank()) return "there";
        return name.trim().split("\\s+")[0];
    }
}
