package com.emart.service;

import com.emart.dto.PlaceOrderRequest;
import com.emart.entity.Product;
import com.emart.entity.Role;
import com.emart.entity.User;
import com.emart.exception.ApiException;
import com.emart.repository.ProductRepository;
import com.emart.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Role-aware cart pricing, shared by the order and coupon flows (kept separate to avoid a
 * circular dependency between OrderService and CouponService). Validates product availability,
 * dealer minimums and selects retail vs wholesale prices. Does NOT touch stock or save anything.
 */
@Service
public class PricingService {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Value("${app.dealer.min-order-qty:10}")
    private int dealerMinOrderQty;

    public PricingService(ProductRepository productRepository, UserRepository userRepository) {
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public PricedCart priceItems(Long userId, List<PlaceOrderRequest.Item> items) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("User not found."));
        boolean isDealer = user.getRole() == Role.DEALER;

        BigDecimal gross = BigDecimal.ZERO;
        List<PricedLine> lines = new ArrayList<>();

        for (PlaceOrderRequest.Item item : items) {
            Product product = productRepository.findById(item.productId())
                    .orElseThrow(() -> ApiException.badRequest("A product in your cart no longer exists."));

            if (!product.isActive()) {
                throw ApiException.badRequest("'" + product.getName() + "' is no longer available.");
            }
            if (isDealer && item.quantity() < dealerMinOrderQty) {
                throw ApiException.badRequest("Dealers must order at least " + dealerMinOrderQty
                        + " units of each item. '" + product.getName() + "' has only " + item.quantity() + ".");
            }
            if (product.getStockQty() < item.quantity()) {
                throw ApiException.badRequest("'" + product.getName() + "' has only "
                        + product.getStockQty() + " left in stock.");
            }

            BigDecimal unitPrice;
            if (isDealer) {
                if (product.getWholesalePrice() == null) {
                    throw ApiException.badRequest("Wholesale price is not set for '" + product.getName() + "'.");
                }
                unitPrice = product.getWholesalePrice();
            } else {
                unitPrice = product.getRetailPrice();
            }

            lines.add(new PricedLine(product.getId(), item.quantity(), unitPrice));
            gross = gross.add(unitPrice.multiply(BigDecimal.valueOf(item.quantity())));
        }

        return new PricedCart(user, isDealer, gross, lines);
    }

    public record PricedCart(User user, boolean dealer, BigDecimal gross, List<PricedLine> lines) {}

    public record PricedLine(Long productId, Integer quantity, BigDecimal unitPrice) {}
}
