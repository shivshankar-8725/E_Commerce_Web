package com.emart.controller;

import com.emart.dto.ApplyCouponRequest;
import com.emart.dto.ApplyCouponResponse;
import com.emart.security.SecurityUtils;
import com.emart.service.CouponService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Customer-side coupon preview (P4-OFFER-01). Requires an authenticated customer/dealer because
 * the discount is computed against role-aware (retail/wholesale) prices.
 */
@RestController
@RequestMapping("/api/coupons")
public class CouponController {

    private final CouponService couponService;

    public CouponController(CouponService couponService) {
        this.couponService = couponService;
    }

    @PostMapping("/apply")
    public ResponseEntity<ApplyCouponResponse> apply(@Valid @RequestBody ApplyCouponRequest req) {
        return ResponseEntity.ok(couponService.preview(SecurityUtils.currentUserId(), req));
    }
}
