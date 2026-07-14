package com.emart.controller.admin;

import com.emart.dto.SummaryResponse;
import com.emart.service.OrderService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Admin dashboard summary (P1-ADMIN-08).
 */
@RestController
@RequestMapping("/api/admin/dashboard")
@PreAuthorize("hasRole('ADMIN')")
public class AdminDashboardController {

    private final OrderService orderService;

    public AdminDashboardController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping("/summary")
    public ResponseEntity<SummaryResponse> summary() {
        return ResponseEntity.ok(orderService.todaySummary());
    }
}
