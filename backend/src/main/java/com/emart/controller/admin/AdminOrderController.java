package com.emart.controller.admin;

import com.emart.dto.OrderResponse;
import com.emart.dto.RejectOrderRequest;
import com.emart.dto.UpdateStatusRequest;
import com.emart.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Admin order management (P1-ADMIN-04/05/06).
 */
@RestController
@RequestMapping("/api/admin/orders")
@PreAuthorize("hasRole('ADMIN')")
public class AdminOrderController {

    private final OrderService orderService;

    public AdminOrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping
    public ResponseEntity<List<OrderResponse>> list() {
        return ResponseEntity.ok(orderService.listAllForAdmin());
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> get(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getForAdmin(id));
    }

    /** P1-ADMIN-05: advance status (ACCEPTED/PACKED/OUT_FOR_DELIVERY/DELIVERED). */
    @PatchMapping("/{id}/status")
    public ResponseEntity<OrderResponse> updateStatus(@PathVariable Long id,
                                                      @Valid @RequestBody UpdateStatusRequest req) {
        return ResponseEntity.ok(orderService.updateStatus(id, req.status()));
    }

    /** P1-ADMIN-06: accept a newly placed order. */
    @PatchMapping("/{id}/accept")
    public ResponseEntity<OrderResponse> accept(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.accept(id));
    }

    /** P1-ADMIN-06: reject with reason (restores stock). */
    @PatchMapping("/{id}/reject")
    public ResponseEntity<OrderResponse> reject(@PathVariable Long id,
                                                @Valid @RequestBody RejectOrderRequest req) {
        return ResponseEntity.ok(orderService.reject(id, req.reason()));
    }
}
