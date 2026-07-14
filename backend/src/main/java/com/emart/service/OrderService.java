package com.emart.service;

import com.emart.dto.OrderResponse;
import com.emart.dto.PlaceOrderRequest;
import com.emart.dto.SummaryResponse;
import com.emart.entity.*;
import com.emart.exception.ApiException;
import com.emart.repository.OrderRepository;
import com.emart.repository.ProductRepository;
import com.emart.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.*;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final AddressService addressService;
    private final PincodeService pincodeService;
    private final PricingService pricingService;
    private final CouponService couponService;
    private final NotificationService notificationService;
    private final AppNotificationService appNotificationService;
    private final DeliveryService deliveryService;

    // Allowed forward order of statuses (REJECTED handled separately)
    private static final List<OrderStatus> FLOW = List.of(
            OrderStatus.PLACED, OrderStatus.ACCEPTED, OrderStatus.PACKED,
            OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED);

    public OrderService(OrderRepository orderRepository, ProductRepository productRepository,
                        UserRepository userRepository, AddressService addressService,
                        PincodeService pincodeService, PricingService pricingService,
                        CouponService couponService, NotificationService notificationService,
                        AppNotificationService appNotificationService, DeliveryService deliveryService) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.addressService = addressService;
        this.pincodeService = pincodeService;
        this.pricingService = pricingService;
        this.couponService = couponService;
        this.notificationService = notificationService;
        this.appNotificationService = appNotificationService;
        this.deliveryService = deliveryService;
    }

    /** P1-CUST-06: place a COD order. ONLINE orders go through the payment flow instead. */
    @Transactional
    public OrderResponse placeOrder(Long userId, PlaceOrderRequest req) {
        if (req.paymentMode() == PaymentMode.ONLINE) {
            // P3-PAY-01: online orders must be paid first via /api/payments
            throw ApiException.badRequest("Online orders must be placed through the payment flow.");
        }
        PricedOrder priced = validateAndPrice(userId, req);
        Order order = persistOrder(priced, PaymentMode.COD, PaymentStatus.PENDING, null, null);
        return OrderResponse.from(order);
    }

    /**
     * Validate the cart, apply any coupon, and compute per-line prices WITHOUT touching stock.
     * Used by the COD flow and by the online payment flow (to compute the amount to charge).
     */
    @Transactional(readOnly = true)
    public PricedOrder validateAndPrice(Long userId, PlaceOrderRequest req) {
        PricingService.PricedCart cart = pricingService.priceItems(userId, req.items());

        Address address = addressService.getOwnedOrThrow(userId, req.addressId());

        // P1-CUST-05 / P1-SYS-01: delivery area check
        if (!pincodeService.isAllowed(address.getPincode())) {
            throw ApiException.badRequest(
                    "Sorry, we do not deliver to pincode " + address.getPincode() + " yet.");
        }

        // P4-OFFER-01: apply coupon if provided
        BigDecimal discount = BigDecimal.ZERO;
        String couponCode = null;
        if (req.couponCode() != null && !req.couponCode().isBlank()) {
            CouponService.Computed c = couponService.validateAndCompute(req.couponCode(), cart.gross());
            discount = c.discountAmount();
            couponCode = c.coupon().getCode();
        }

        return new PricedOrder(cart.user(), address, cart.dealer(), cart.gross(),
                discount, couponCode, cart.lines());
    }

    /**
     * P3-PAY-02: place a PAID online order from pre-validated lines (called after Razorpay verification).
     * Re-checks stock and reduces it, applies the stored discount, records txn + Razorpay order id.
     */
    @Transactional
    public OrderResponse placeOnlinePaidOrder(Long userId, Long addressId, List<PricingService.PricedLine> lines,
                                              boolean isDealer, BigDecimal discount, String couponCode,
                                              String paymentTxnId, String razorpayOrderId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("User not found."));
        Address address = addressService.getOwnedOrThrow(userId, addressId);
        PricedOrder priced = new PricedOrder(user, address, isDealer, null, discount, couponCode, lines);
        Order order = persistOrder(priced, PaymentMode.ONLINE, PaymentStatus.PAID, paymentTxnId, razorpayOrderId);
        return OrderResponse.from(order);
    }

    /** Shared persistence: reduces stock, applies discount, writes the order + items. */
    private Order persistOrder(PricedOrder priced, PaymentMode mode, PaymentStatus payStatus,
                               String paymentTxnId, String razorpayOrderId) {
        Order order = new Order();
        order.setUser(priced.user());
        order.setAddress(priced.address());
        // Snapshot the address so later edits to the saved address don't change this order.
        Address adr = priced.address();
        order.setDeliveryLine1(adr.getLine1());
        order.setDeliveryCity(adr.getCity());
        order.setDeliveryPincode(adr.getPincode());
        order.setDeliveryPhone(adr.getPhone());
        order.setPaymentMode(mode);
        order.setPaymentStatus(payStatus);
        order.setStatus(OrderStatus.PLACED);
        order.setOrderNumber(generateOrderNumber());
        order.setDealerOrder(priced.dealerOrder());
        order.setPaymentTxnId(paymentTxnId);
        order.setRazorpayOrderId(razorpayOrderId);

        BigDecimal lineSum = BigDecimal.ZERO;
        for (PricingService.PricedLine line : priced.lines()) {
            Product product = productRepository.findById(line.productId())
                    .orElseThrow(() -> ApiException.badRequest("A product in your cart no longer exists."));
            if (!product.isActive()) {
                throw ApiException.badRequest("'" + product.getName() + "' is no longer available.");
            }
            if (product.getStockQty() < line.quantity()) {
                throw ApiException.badRequest("'" + product.getName() + "' has only "
                        + product.getStockQty() + " left in stock.");
            }
            product.setStockQty(product.getStockQty() - line.quantity());
            productRepository.save(product);

            OrderItem oi = new OrderItem();
            oi.setProduct(product);
            oi.setQuantity(line.quantity());
            oi.setPriceAtOrder(line.unitPrice());
            order.addItem(oi);

            lineSum = lineSum.add(line.unitPrice().multiply(BigDecimal.valueOf(line.quantity())));
        }

        // P4-OFFER-01: apply coupon discount; then add delivery charge if under threshold.
        BigDecimal discount = priced.discount() != null ? priced.discount() : BigDecimal.ZERO;
        BigDecimal net = lineSum.subtract(discount).max(BigDecimal.ZERO);
        BigDecimal delivery = deliveryService.chargeFor(net);
        order.setDiscountAmount(discount);
        order.setCouponCode(priced.couponCode());
        order.setDeliveryCharge(delivery);
        order.setTotalAmount(net.add(delivery));

        Order saved = orderRepository.save(order);
        if (priced.couponCode() != null && !priced.couponCode().isBlank()) {
            couponService.markUsed(priced.couponCode());
        }

        // P4-NOTI-01: alert the admin of the new order (SMS + in-app).
        notificationService.notifyAdminNewOrder(
                saved.getOrderNumber(), saved.getTotalAmount(),
                priced.user().getName(), priced.user().getMobile(), saved.isDealerOrder());
        appNotificationService.notifyAdmins("NEW_ORDER", "New order received",
                (saved.isDealerOrder() ? "Dealer order " : "Order ") + saved.getOrderNumber()
                        + " for Rs " + saved.getTotalAmount() + " from " + priced.user().getName() + ".",
                "/admin/orders/" + saved.getId());

        return saved;
    }

    /** A validated, priced cart ready to persist (no stock taken yet). */
    public record PricedOrder(User user, Address address, boolean dealerOrder,
                              BigDecimal gross, BigDecimal discount, String couponCode,
                              List<PricingService.PricedLine> lines) {}

    /** P1-CUST-08: order history for the current customer. */
    @Transactional(readOnly = true)
    public List<OrderResponse> historyForUser(Long userId) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(OrderResponse::from).toList();
    }

    /** P1-CUST-07: order detail / tracking (owner only). */
    @Transactional(readOnly = true)
    public OrderResponse getForUser(Long userId, Long orderId) {
        Order order = findOrThrow(orderId);
        if (!order.getUser().getId().equals(userId)) {
            throw ApiException.forbidden("This order does not belong to you.");
        }
        return OrderResponse.from(order);
    }

    /** P1-ADMIN-04: all orders, latest first. */
    @Transactional(readOnly = true)
    public List<OrderResponse> listAllForAdmin() {
        return orderRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(OrderResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public OrderResponse getForAdmin(Long orderId) {
        return OrderResponse.from(findOrThrow(orderId));
    }

    /** P1-ADMIN-05: advance order status along the defined flow. */
    @Transactional
    public OrderResponse updateStatus(Long orderId, OrderStatus newStatus) {
        Order order = findOrThrow(orderId);

        if (order.getStatus() == OrderStatus.REJECTED) {
            throw ApiException.badRequest("A rejected order cannot change status.");
        }
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw ApiException.badRequest("A cancelled order cannot change status.");
        }
        if (order.getStatus() == OrderStatus.DELIVERED) {
            throw ApiException.badRequest("This order is already delivered.");
        }
        if (newStatus == OrderStatus.PLACED || newStatus == OrderStatus.REJECTED) {
            throw ApiException.badRequest("Use the accept/reject action for this status.");
        }
        if (FLOW.indexOf(newStatus) <= FLOW.indexOf(order.getStatus())) {
            throw ApiException.badRequest("Status can only move forward in the delivery flow.");
        }

        order.setStatus(newStatus);
        // Mark COD as PAID once delivered (admin collects cash)
        if (newStatus == OrderStatus.DELIVERED) {
            order.setPaymentStatus(PaymentStatus.PAID);
        }
        Order saved = orderRepository.save(order);
        notifyStatus(saved); // P4-NOTI-01
        return OrderResponse.from(saved);
    }

    /** P1-ADMIN-06: accept an order (PLACED -> ACCEPTED). */
    @Transactional
    public OrderResponse accept(Long orderId) {
        Order order = findOrThrow(orderId);
        if (order.getStatus() != OrderStatus.PLACED) {
            throw ApiException.badRequest("Only newly placed orders can be accepted.");
        }
        order.setStatus(OrderStatus.ACCEPTED);
        order.setAcceptedAt(Instant.now()); // estimated delivery = acceptedAt + 2 days
        Order saved = orderRepository.save(order);
        notifyStatus(saved); // P4-NOTI-01
        return OrderResponse.from(saved);
    }

    /** P1-ADMIN-06: reject with reason and restore stock. */
    @Transactional
    public OrderResponse reject(Long orderId, String reason) {
        Order order = findOrThrow(orderId);
        if (order.getStatus() == OrderStatus.REJECTED) {
            throw ApiException.badRequest("This order is already rejected.");
        }
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw ApiException.badRequest("This order was cancelled by the customer.");
        }
        if (order.getStatus() == OrderStatus.OUT_FOR_DELIVERY || order.getStatus() == OrderStatus.DELIVERED) {
            throw ApiException.badRequest("Orders that are out for delivery or delivered cannot be rejected.");
        }

        // restore stock
        for (OrderItem item : order.getItems()) {
            Product product = item.getProduct();
            product.setStockQty(product.getStockQty() + item.getQuantity());
            productRepository.save(product);
        }

        order.setStatus(OrderStatus.REJECTED);
        order.setRejectReason(reason.trim());
        Order saved = orderRepository.save(order);
        notifyStatus(saved); // P4-NOTI-01
        return OrderResponse.from(saved);
    }

    /** Customer cancels their own order before it is dispatched. Restores stock. */
    @Transactional
    public OrderResponse cancelByCustomer(Long userId, Long orderId) {
        Order order = findOrThrow(orderId);
        if (!order.getUser().getId().equals(userId)) {
            throw ApiException.forbidden("This order does not belong to you.");
        }
        if (order.getStatus() == OrderStatus.OUT_FOR_DELIVERY || order.getStatus() == OrderStatus.DELIVERED) {
            throw ApiException.badRequest("This order is already out for delivery and can no longer be cancelled.");
        }
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw ApiException.badRequest("This order is already cancelled.");
        }
        if (order.getStatus() == OrderStatus.REJECTED) {
            throw ApiException.badRequest("This order was rejected and cannot be cancelled.");
        }

        // restore stock
        for (OrderItem item : order.getItems()) {
            Product product = item.getProduct();
            product.setStockQty(product.getStockQty() + item.getQuantity());
            productRepository.save(product);
        }

        order.setStatus(OrderStatus.CANCELLED);
        order.setRejectReason("Cancelled by customer");
        Order saved = orderRepository.save(order);

        // notify admins
        appNotificationService.notifyAdmins("ORDER_STATUS", "Order cancelled",
                "Order " + saved.getOrderNumber() + " was cancelled by " + order.getUser().getName() + ".",
                "/admin/orders/" + saved.getId());

        return OrderResponse.from(saved);
    }

    /** Notify the customer about the order's current status (SMS + in-app). */
    private void notifyStatus(Order order) {
        notificationService.notifyCustomerStatus(
                order.getUser().getMobile(), order.getUser().getName(),
                order.getOrderNumber(), order.getStatus(), order.getRejectReason());

        String label = order.getStatus().name().replace('_', ' ').toLowerCase();
        String msg = "Your order " + order.getOrderNumber() + " is now " + label + "."
                + (order.getStatus() == OrderStatus.REJECTED && order.getRejectReason() != null
                    ? " Reason: " + order.getRejectReason() : "");
        appNotificationService.notifyUser(order.getUser().getId(), "ORDER_STATUS",
                "Order " + label, msg, "/orders/" + order.getId());
    }

    /** P1-ADMIN-08: today's order count and total amount. */
    public SummaryResponse todaySummary() {
        ZoneId zone = ZoneId.systemDefault();
        Instant start = LocalDate.now(zone).atStartOfDay(zone).toInstant();
        Instant end = LocalDate.now(zone).plusDays(1).atStartOfDay(zone).toInstant();
        long count = orderRepository.countOrdersBetween(start, end);
        BigDecimal total = orderRepository.sumOrderAmountBetween(start, end);
        return new SummaryResponse(count, total != null ? total : BigDecimal.ZERO);
    }

    private Order findOrThrow(Long orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> ApiException.notFound("Order not found."));
    }

    private String generateOrderNumber() {
        String datePart = LocalDate.now().toString().replace("-", "");
        for (int i = 0; i < 10; i++) {
            String candidate = "ORD-" + datePart + "-" + ThreadLocalRandom.current().nextInt(100000, 1000000);
            if (!orderRepository.existsByOrderNumber(candidate)) {
                return candidate;
            }
        }
        // extremely unlikely fallback
        return "ORD-" + datePart + "-" + System.nanoTime();
    }
}
