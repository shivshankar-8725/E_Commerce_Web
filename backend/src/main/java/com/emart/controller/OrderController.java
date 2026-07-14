package com.emart.controller;

import com.emart.dto.OrderResponse;
import com.emart.dto.PlaceOrderRequest;
import com.emart.security.SecurityUtils;
import com.emart.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Customer order endpoints (P1-CUST-06/07/08). Requires authentication; scoped to current user.
 */
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    /** P1-CUST-06: place a COD order. */
    @PostMapping
    public ResponseEntity<OrderResponse> place(@Valid @RequestBody PlaceOrderRequest req) {
        return ResponseEntity.ok(orderService.placeOrder(SecurityUtils.currentUserId(), req));
    }

    /** P1-CUST-08: order history. */
    @GetMapping
    public ResponseEntity<List<OrderResponse>> history() {
        return ResponseEntity.ok(orderService.historyForUser(SecurityUtils.currentUserId()));
    }

    /** P1-CUST-07: order tracking / detail. */
    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> detail(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getForUser(SecurityUtils.currentUserId(), id));
    }

    /** Customer cancels their own order before it is dispatched. */
    @PatchMapping("/{id}/cancel")
    public ResponseEntity<OrderResponse> cancel(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.cancelByCustomer(SecurityUtils.currentUserId(), id));
    }
}
