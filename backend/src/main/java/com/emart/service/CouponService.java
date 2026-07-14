package com.emart.service;

import com.emart.dto.ApplyCouponRequest;
import com.emart.dto.ApplyCouponResponse;
import com.emart.dto.CouponRequest;
import com.emart.dto.CouponResponse;
import com.emart.entity.Coupon;
import com.emart.entity.DiscountType;
import com.emart.exception.ApiException;
import com.emart.repository.CouponRepository;
import com.emart.service.PricingService.PricedCart;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

@Service
public class CouponService {

    private final CouponRepository couponRepository;
    private final PricingService pricingService;

    public CouponService(CouponRepository couponRepository, PricingService pricingService) {
        this.couponRepository = couponRepository;
        this.pricingService = pricingService;
    }

    /** Result of validating a coupon against a cart total. */
    public record Computed(Coupon coupon, BigDecimal discountAmount) {}

    // ---------- Admin CRUD ----------

    public java.util.List<CouponResponse> listAll() {
        return couponRepository.findAllByOrderByCreatedAtDesc().stream().map(CouponResponse::from).toList();
    }

    @Transactional
    public CouponResponse create(CouponRequest req) {
        String code = req.code().trim().toUpperCase();
        if (couponRepository.existsByCodeIgnoreCase(code)) {
            throw ApiException.conflict("A coupon with this code already exists.");
        }
        validateDates(req);
        Coupon c = new Coupon();
        c.setCode(code);
        apply(c, req);
        return CouponResponse.from(couponRepository.save(c));
    }

    @Transactional
    public CouponResponse update(Long id, CouponRequest req) {
        Coupon c = couponRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Coupon not found."));
        String code = req.code().trim().toUpperCase();
        if (!c.getCode().equalsIgnoreCase(code) && couponRepository.existsByCodeIgnoreCase(code)) {
            throw ApiException.conflict("A coupon with this code already exists.");
        }
        validateDates(req);
        c.setCode(code);
        apply(c, req);
        return CouponResponse.from(couponRepository.save(c));
    }

    @Transactional
    public CouponResponse deactivate(Long id) {
        Coupon c = couponRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Coupon not found."));
        c.setActive(false);
        return CouponResponse.from(couponRepository.save(c));
    }

    private void apply(Coupon c, CouponRequest req) {
        c.setDescription(req.description());
        c.setDiscountType(req.discountType());
        c.setDiscountValue(req.discountValue());
        c.setMaxDiscount(req.maxDiscount());
        c.setMinOrderAmount(req.minOrderAmount() != null ? req.minOrderAmount() : BigDecimal.ZERO);
        c.setValidFrom(req.validFrom());
        c.setValidUntil(req.validUntil());
        c.setUsageLimit(req.usageLimit());
        c.setActive(req.isActive() == null || req.isActive());
        if (req.discountType() == DiscountType.PERCENT
                && req.discountValue().compareTo(BigDecimal.valueOf(100)) > 0) {
            throw ApiException.badRequest("Percentage discount cannot exceed 100%.");
        }
    }

    private void validateDates(CouponRequest req) {
        if (req.validFrom() != null && req.validUntil() != null && req.validUntil().isBefore(req.validFrom())) {
            throw ApiException.badRequest("'Valid until' cannot be before 'valid from'.");
        }
    }

    // ---------- Customer apply / validation ----------

    /** Preview a coupon against the current cart (role-aware gross). */
    public ApplyCouponResponse preview(Long userId, ApplyCouponRequest req) {
        PricedCart cart = pricingService.priceItems(userId, req.items());
        Computed c = validateAndCompute(req.code(), cart.gross());
        BigDecimal net = cart.gross().subtract(c.discountAmount()).max(BigDecimal.ZERO);
        return new ApplyCouponResponse(
                c.coupon().getCode(),
                c.coupon().getDiscountType().name(),
                c.coupon().getDiscountValue(),
                c.discountAmount(),
                cart.gross(),
                net,
                "Coupon applied! You save " + c.discountAmount() + ".");
    }

    /**
     * Validate a coupon for a given gross cart amount and compute the discount.
     * Throws a clear ApiException if the coupon is invalid/expired/ineligible (P4-OFFER-01).
     */
    public Computed validateAndCompute(String code, BigDecimal gross) {
        Coupon c = couponRepository.findByCodeIgnoreCase(code.trim())
                .orElseThrow(() -> ApiException.badRequest("Invalid coupon code."));

        if (!c.isActive()) {
            throw ApiException.badRequest("This coupon is no longer active.");
        }
        LocalDate today = LocalDate.now();
        if (c.getValidFrom() != null && today.isBefore(c.getValidFrom())) {
            throw ApiException.badRequest("This coupon is not active yet.");
        }
        if (c.getValidUntil() != null && today.isAfter(c.getValidUntil())) {
            throw ApiException.badRequest("This coupon has expired.");
        }
        if (c.getUsageLimit() != null && c.getUsedCount() >= c.getUsageLimit()) {
            throw ApiException.badRequest("This coupon has reached its usage limit.");
        }
        if (c.getMinOrderAmount() != null && gross.compareTo(c.getMinOrderAmount()) < 0) {
            throw ApiException.badRequest("This coupon needs a minimum order of " + c.getMinOrderAmount() + ".");
        }

        BigDecimal discount = computeDiscount(c, gross);
        if (discount.signum() <= 0) {
            throw ApiException.badRequest("This coupon does not apply to your cart.");
        }
        return new Computed(c, discount);
    }

    private BigDecimal computeDiscount(Coupon c, BigDecimal gross) {
        BigDecimal discount;
        if (c.getDiscountType() == DiscountType.PERCENT) {
            discount = gross.multiply(c.getDiscountValue())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            if (c.getMaxDiscount() != null && discount.compareTo(c.getMaxDiscount()) > 0) {
                discount = c.getMaxDiscount();
            }
        } else {
            discount = c.getDiscountValue();
        }
        // never discount more than the cart total
        if (discount.compareTo(gross) > 0) discount = gross;
        return discount.setScale(2, RoundingMode.HALF_UP);
    }

    /** Increment usage count after an order using this coupon is placed. */
    @Transactional
    public void markUsed(String code) {
        couponRepository.findByCodeIgnoreCase(code.trim()).ifPresent(c -> {
            c.setUsedCount(c.getUsedCount() + 1);
            couponRepository.save(c);
        });
    }
}
