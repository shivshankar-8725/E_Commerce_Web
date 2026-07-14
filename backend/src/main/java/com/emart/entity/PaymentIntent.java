package com.emart.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

/**
 * Phase 3: a server-side record of an intended ONLINE order, created BEFORE payment.
 * It stores the validated & priced cart so that, after Razorpay confirms payment, the order
 * is placed from trusted server data (the client cannot tamper with items or amount).
 * No stock is reserved until the payment is verified and the order is actually placed.
 */
@Entity
@Table(name = "payment_intents",
        uniqueConstraints = @UniqueConstraint(name = "uk_intent_rzp_order", columnNames = "razorpay_order_id"))
public class PaymentIntent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "razorpay_order_id", nullable = false, unique = true)
    private String razorpayOrderId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "address_id", nullable = false)
    private Long addressId;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;          // net payable (after discount)

    @Column(nullable = false)
    private String currency;

    // Phase 4 (P4-OFFER-01): coupon applied to this intended order
    @Column(name = "discount_amount", precision = 10, scale = 2)
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "coupon_code")
    private String couponCode;

    // JSON: [{ "productId":1, "quantity":2, "unitPrice":20.00 }, ...]
    @Column(name = "items_json", nullable = false, columnDefinition = "text")
    private String itemsJson;

    @Column(name = "is_dealer_order", nullable = false)
    private boolean dealerOrder;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentIntentStatus status = PaymentIntentStatus.CREATED;

    @Column(name = "payment_txn_id")
    private String paymentTxnId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getRazorpayOrderId() { return razorpayOrderId; }
    public void setRazorpayOrderId(String razorpayOrderId) { this.razorpayOrderId = razorpayOrderId; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Long getAddressId() { return addressId; }
    public void setAddressId(Long addressId) { this.addressId = addressId; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public BigDecimal getDiscountAmount() { return discountAmount; }
    public void setDiscountAmount(BigDecimal discountAmount) { this.discountAmount = discountAmount; }

    public String getCouponCode() { return couponCode; }
    public void setCouponCode(String couponCode) { this.couponCode = couponCode; }

    public String getItemsJson() { return itemsJson; }
    public void setItemsJson(String itemsJson) { this.itemsJson = itemsJson; }

    public boolean isDealerOrder() { return dealerOrder; }
    public void setDealerOrder(boolean dealerOrder) { this.dealerOrder = dealerOrder; }

    public PaymentIntentStatus getStatus() { return status; }
    public void setStatus(PaymentIntentStatus status) { this.status = status; }

    public String getPaymentTxnId() { return paymentTxnId; }
    public void setPaymentTxnId(String paymentTxnId) { this.paymentTxnId = paymentTxnId; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
