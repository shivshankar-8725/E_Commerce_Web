package com.emart.controller;

import com.emart.service.PaymentService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Public client config: dealer minimum order quantity (P2-DEAL-04) and whether online
 * payment is available (P3-PAY-01). Backend remains the source of truth.
 */
@RestController
@RequestMapping("/api/config")
public class ConfigController {

    @Value("${app.dealer.min-order-qty:10}")
    private int dealerMinOrderQty;

    @Value("${app.upi.id:}")
    private String upiId;

    @Value("${app.upi.payee-name:SoluSphere}")
    private String upiPayeeName;

    private final PaymentService paymentService;
    private final com.emart.service.DeliveryService deliveryService;

    public ConfigController(PaymentService paymentService, com.emart.service.DeliveryService deliveryService) {
        this.paymentService = paymentService;
        this.deliveryService = deliveryService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> config() {
        return ResponseEntity.ok(Map.of(
                "dealerMinOrderQty", dealerMinOrderQty,
                "onlinePaymentEnabled", paymentService.isOnlineEnabled(),
                "deliveryCharge", deliveryService.getCharge(),
                "freeDeliveryAbove", deliveryService.getFreeAbove(),
                // UPI QR payment: enabled only when a UPI ID is configured.
                "upiEnabled", upiId != null && !upiId.isBlank(),
                "upiId", upiId == null ? "" : upiId,
                "upiPayeeName", upiPayeeName == null ? "" : upiPayeeName
        ));
    }
}
