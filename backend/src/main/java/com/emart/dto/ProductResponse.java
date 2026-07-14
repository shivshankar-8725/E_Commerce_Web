package com.emart.dto;

import com.emart.entity.Product;

import java.math.BigDecimal;

public record ProductResponse(
        Long id,
        String name,
        String description,
        Long categoryId,
        String categoryName,
        String imageUrl,
        BigDecimal retailPrice,
        BigDecimal wholesalePrice,
        String weight,
        Integer stockQty,
        boolean inStock,
        boolean isActive
) {
    private static ProductResponse build(Product p, BigDecimal retail, BigDecimal wholesale) {
        return new ProductResponse(
                p.getId(),
                p.getName(),
                p.getDescription(),
                p.getCategory() != null ? p.getCategory().getId() : null,
                p.getCategory() != null ? p.getCategory().getName() : null,
                p.getImageUrl(),
                retail,
                wholesale,
                p.getWeight(),
                p.getStockQty(),
                p.getStockQty() != null && p.getStockQty() > 0,
                p.isActive()
        );
    }

    /** Admin view: both prices visible. */
    public static ProductResponse from(Product p) {
        return build(p, p.getRetailPrice(), p.getWholesalePrice());
    }

    /** Customer/public view: wholesale price is NEVER exposed (P2-DEAL-03). */
    public static ProductResponse forCustomer(Product p) {
        return build(p, p.getRetailPrice(), null);
    }

    /** Approved-dealer view: wholesale price shown instead of retail (P2-DEAL-03). */
    public static ProductResponse forDealer(Product p) {
        return build(p, null, p.getWholesalePrice());
    }
}
