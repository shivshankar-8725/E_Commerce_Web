package com.emart.controller;

import com.emart.dto.CreatePaymentResponse;
import com.emart.dto.OrderResponse;
import com.emart.dto.PlaceOrderRequest;
import com.emart.dto.VerifyPaymentRequest;
import com.emart.security.SecurityUtils;
import com.emart.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Phase 3 online payments (Razorpay). Requires an authenticated customer/dealer.
 */
@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    /** P3-PAY-02 step 1: create a Razorpay order for the current cart. */
    @PostMapping("/create-order")
    public ResponseEntity<CreatePaymentResponse> createOrder(@Valid @RequestBody PlaceOrderRequest req) {
        return ResponseEntity.ok(paymentService.createOrder(SecurityUtils.currentUserId(), req));
    }

    /** P3-PAY-02 step 2: verify the signature and place the PAID order. */
    @PostMapping("/verify")
    public ResponseEntity<OrderResponse> verify(@Valid @RequestBody VerifyPaymentRequest req) {
        return ResponseEntity.ok(paymentService.verifyAndPlace(SecurityUtils.currentUserId(), req));
    }

    /** P3-PAY-02: payment cancelled/failed in the browser (no order placed). */
    @PostMapping("/failed")
    public ResponseEntity<Map<String, String>> failed(@RequestBody Map<String, String> body) {
        String razorpayOrderId = body.get("razorpayOrderId");
        if (razorpayOrderId != null) {
            paymentService.markFailed(SecurityUtils.currentUserId(), razorpayOrderId);
        }
        return ResponseEntity.ok(Map.of("message", "Payment was not completed. No order has been placed."));
    }
}
