package com.emart.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Human-friendly unique order number (e.g. ORD-20260627-000123)
    @Column(name = "order_number", nullable = false, unique = true)
    private String orderNumber;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "address_id")
    private Address address;   // reference to the saved address (book) it was placed from

    // Snapshot of the delivery address at order time, so editing the saved address later
    // never changes this order. Each order is independent ("order-wise").
    @Column(name = "delivery_line1")
    private String deliveryLine1;
    @Column(name = "delivery_city")
    private String deliveryCity;
    @Column(name = "delivery_pincode")
    private String deliveryPincode;
    @Column(name = "delivery_phone")
    private String deliveryPhone;

    @Column(name = "total_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;        // net payable (after discount)

    // Phase 4 (P4-OFFER-01): coupon discount applied to this order
    @Column(name = "discount_amount", precision = 10, scale = 2)
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "coupon_code")
    private String couponCode;

    // Delivery fee added when the order is below the free-delivery threshold
    @Column(name = "delivery_charge", precision = 10, scale = 2)
    private BigDecimal deliveryCharge = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_mode", nullable = false)
    private PaymentMode paymentMode;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false)
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status = OrderStatus.PLACED;

    @Column(name = "reject_reason")
    private String rejectReason;

    // Phase 2: true when placed by a DEALER (bulk/wholesale order)
    @Column(name = "is_dealer_order", nullable = false)
    private boolean isDealerOrder = false;

    // Phase 3: online payment references (null for COD)
    @Column(name = "payment_txn_id")
    private String paymentTxnId;        // Razorpay payment id (txn id)

    @Column(name = "razorpay_order_id")
    private String razorpayOrderId;     // Razorpay order id

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    // Set when the admin accepts the order; estimated delivery = acceptedAt + 2 days.
    @Column(name = "accepted_at")
    private Instant acceptedAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = Instant.now();
    }

    public void addItem(OrderItem item) {
        items.add(item);
        item.setOrder(this);
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getOrderNumber() { return orderNumber; }
    public void setOrderNumber(String orderNumber) { this.orderNumber = orderNumber; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Address getAddress() { return address; }
    public void setAddress(Address address) { this.address = address; }

    public String getDeliveryLine1() { return deliveryLine1; }
    public void setDeliveryLine1(String deliveryLine1) { this.deliveryLine1 = deliveryLine1; }

    public String getDeliveryCity() { return deliveryCity; }
    public void setDeliveryCity(String deliveryCity) { this.deliveryCity = deliveryCity; }

    public String getDeliveryPincode() { return deliveryPincode; }
    public void setDeliveryPincode(String deliveryPincode) { this.deliveryPincode = deliveryPincode; }

    public String getDeliveryPhone() { return deliveryPhone; }
    public void setDeliveryPhone(String deliveryPhone) { this.deliveryPhone = deliveryPhone; }

    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }

    public BigDecimal getDiscountAmount() { return discountAmount; }
    public void setDiscountAmount(BigDecimal discountAmount) { this.discountAmount = discountAmount; }

    public String getCouponCode() { return couponCode; }
    public void setCouponCode(String couponCode) { this.couponCode = couponCode; }

    public BigDecimal getDeliveryCharge() { return deliveryCharge; }
    public void setDeliveryCharge(BigDecimal deliveryCharge) { this.deliveryCharge = deliveryCharge; }

    public PaymentMode getPaymentMode() { return paymentMode; }
    public void setPaymentMode(PaymentMode paymentMode) { this.paymentMode = paymentMode; }

    public PaymentStatus getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(PaymentStatus paymentStatus) { this.paymentStatus = paymentStatus; }

    public OrderStatus getStatus() { return status; }
    public void setStatus(OrderStatus status) { this.status = status; }

    public String getRejectReason() { return rejectReason; }
    public void setRejectReason(String rejectReason) { this.rejectReason = rejectReason; }

    public boolean isDealerOrder() { return isDealerOrder; }
    public void setDealerOrder(boolean dealerOrder) { isDealerOrder = dealerOrder; }

    public String getPaymentTxnId() { return paymentTxnId; }
    public void setPaymentTxnId(String paymentTxnId) { this.paymentTxnId = paymentTxnId; }

    public String getRazorpayOrderId() { return razorpayOrderId; }
    public void setRazorpayOrderId(String razorpayOrderId) { this.razorpayOrderId = razorpayOrderId; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getAcceptedAt() { return acceptedAt; }
    public void setAcceptedAt(Instant acceptedAt) { this.acceptedAt = acceptedAt; }

    public List<OrderItem> getItems() { return items; }
    public void setItems(List<OrderItem> items) { this.items = items; }
}
