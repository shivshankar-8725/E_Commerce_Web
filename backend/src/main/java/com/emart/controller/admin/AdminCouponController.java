package com.emart.controller.admin;

import com.emart.dto.CouponRequest;
import com.emart.dto.CouponResponse;
import com.emart.service.CouponService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Admin coupon management (P4-OFFER-01).
 */
@RestController
@RequestMapping("/api/admin/coupons")
@PreAuthorize("hasRole('ADMIN')")
public class AdminCouponController {

    private final CouponService couponService;

    public AdminCouponController(CouponService couponService) {
        this.couponService = couponService;
    }

    @GetMapping
    public ResponseEntity<List<CouponResponse>> list() {
        return ResponseEntity.ok(couponService.listAll());
    }

    @PostMapping
    public ResponseEntity<CouponResponse> create(@Valid @RequestBody CouponRequest req) {
        return ResponseEntity.ok(couponService.create(req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CouponResponse> update(@PathVariable Long id, @Valid @RequestBody CouponRequest req) {
        return ResponseEntity.ok(couponService.update(id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<CouponResponse> deactivate(@PathVariable Long id) {
        return ResponseEntity.ok(couponService.deactivate(id));
    }
}
