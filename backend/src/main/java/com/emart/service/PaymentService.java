package com.emart.service;

import com.emart.dto.CreatePaymentResponse;
import com.emart.dto.OrderResponse;
import com.emart.dto.PlaceOrderRequest;
import com.emart.dto.VerifyPaymentRequest;
import com.emart.entity.PaymentIntent;
import com.emart.entity.PaymentIntentStatus;
import com.emart.entity.User;
import com.emart.exception.ApiException;
import com.emart.repository.PaymentIntentRepository;
import com.emart.repository.UserRepository;
import com.emart.service.OrderService.PricedOrder;
import com.emart.service.PricingService.PricedLine;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.razorpay.RazorpayClient;
import com.razorpay.Utils;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.List;

/**
 * Phase 3 online payments (Razorpay, test mode).
 *
 * Flow:
 *  1) createOrder  -> validate cart, create a Razorpay order, persist a PaymentIntent (no stock taken).
 *  2) verifyAndPlace -> verify the signature server-side, then place the PAID order from the stored intent.
 *  3) markFailed   -> record a cancelled/failed attempt (no order is placed).
 *
 * The Razorpay SECRET is used only here on the backend; the frontend only ever receives the public key id.
 */
@Service
public class PaymentService {

    private final OrderService orderService;
    private final UserRepository userRepository;
    private final PaymentIntentRepository intentRepository;
    private final ObjectMapper objectMapper;
    private final DeliveryService deliveryService;

    @Value("${app.razorpay.key-id:}")
    private String keyId;
    @Value("${app.razorpay.key-secret:}")
    private String keySecret;
    @Value("${app.razorpay.currency:INR}")
    private String currency;

    public PaymentService(OrderService orderService, UserRepository userRepository,
                          PaymentIntentRepository intentRepository, ObjectMapper objectMapper,
                          DeliveryService deliveryService) {
        this.orderService = orderService;
        this.userRepository = userRepository;
        this.intentRepository = intentRepository;
        this.objectMapper = objectMapper;
        this.deliveryService = deliveryService;
    }

    /** P3-PAY-02 step 1: validate cart, create a Razorpay order, store the intent. */
    @Transactional
    public CreatePaymentResponse createOrder(Long userId, PlaceOrderRequest req) {
        ensureConfigured();

        // Validate + price the cart (+ apply coupon). No stock change yet.
        PricedOrder priced = orderService.validateAndPrice(userId, req);
        BigDecimal discount = priced.discount() != null ? priced.discount() : BigDecimal.ZERO;
        BigDecimal net = priced.gross().subtract(discount).max(BigDecimal.ZERO);
        if (net.signum() <= 0) {
            throw ApiException.badRequest("Order amount must be greater than zero.");
        }
        // Add delivery charge so the online charge matches the placed order total.
        BigDecimal payable = net.add(deliveryService.chargeFor(net));
        long amountPaise = payable.multiply(BigDecimal.valueOf(100)).longValueExact();

        // Create the Razorpay order.
        String razorpayOrderId;
        try {
            RazorpayClient client = new RazorpayClient(keyId, keySecret);
            JSONObject options = new JSONObject();
            options.put("amount", amountPaise);
            options.put("currency", currency);
            options.put("receipt", "rcpt_" + userId + "_" + System.nanoTime());
            options.put("payment_capture", 1); // auto-capture on success
            com.razorpay.Order rzpOrder = client.orders.create(options);
            razorpayOrderId = rzpOrder.get("id");
        } catch (Exception e) {
            throw new ApiException(org.springframework.http.HttpStatus.BAD_GATEWAY,
                    "Could not start the payment. Please try again. (" + e.getMessage() + ")");
        }

        // Persist the intent so verification uses trusted server-side data.
        PaymentIntent intent = new PaymentIntent();
        intent.setRazorpayOrderId(razorpayOrderId);
        intent.setUserId(userId);
        intent.setAddressId(req.addressId());
        intent.setAmount(payable);
        intent.setCurrency(currency);
        intent.setDealerOrder(priced.dealerOrder());
        intent.setDiscountAmount(discount);
        intent.setCouponCode(priced.couponCode());
        intent.setItemsJson(writeItems(priced.lines()));
        intent.setStatus(PaymentIntentStatus.CREATED);
        intentRepository.save(intent);

        User user = priced.user();
        return new CreatePaymentResponse(
                keyId, razorpayOrderId, amountPaise, currency,
                "E-Mart", "Order payment",
                new CreatePaymentResponse.Prefill(user.getName(), user.getEmail(), user.getMobile()));
    }

    /** P3-PAY-02 step 2: verify the signature, then place the PAID order. */
    @Transactional
    public OrderResponse verifyAndPlace(Long userId, VerifyPaymentRequest req) {
        ensureConfigured();

        PaymentIntent intent = intentRepository.findByRazorpayOrderId(req.razorpayOrderId())
                .orElseThrow(() -> ApiException.badRequest("Unknown payment. Please start checkout again."));
        if (!intent.getUserId().equals(userId)) {
            throw ApiException.forbidden("This payment does not belong to you.");
        }
        if (intent.getStatus() == PaymentIntentStatus.PAID) {
            throw ApiException.badRequest("This payment has already been processed.");
        }

        // Verify the Razorpay signature (HMAC-SHA256 of order_id|payment_id with the secret).
        boolean valid;
        try {
            JSONObject attributes = new JSONObject();
            attributes.put("razorpay_order_id", req.razorpayOrderId());
            attributes.put("razorpay_payment_id", req.razorpayPaymentId());
            attributes.put("razorpay_signature", req.razorpaySignature());
            valid = Utils.verifyPaymentSignature(attributes, keySecret);
        } catch (Exception e) {
            valid = false;
        }
        if (!valid) {
            intent.setStatus(PaymentIntentStatus.FAILED);
            intentRepository.save(intent);
            throw ApiException.badRequest("Payment verification failed. You have not been charged for an order.");
        }

        // Signature OK -> place the PAID order from the trusted stored cart (incl. stored discount).
        List<PricedLine> lines = readItems(intent.getItemsJson());
        OrderResponse order = orderService.placeOnlinePaidOrder(
                userId, intent.getAddressId(), lines, intent.isDealerOrder(),
                intent.getDiscountAmount(), intent.getCouponCode(),
                req.razorpayPaymentId(), req.razorpayOrderId());

        intent.setStatus(PaymentIntentStatus.PAID);
        intent.setPaymentTxnId(req.razorpayPaymentId());
        intentRepository.save(intent);

        return order;
    }

    /** P3-PAY-02: customer cancelled or payment failed -> record it; no order placed, no stock taken. */
    @Transactional
    public void markFailed(Long userId, String razorpayOrderId) {
        intentRepository.findByRazorpayOrderId(razorpayOrderId).ifPresent(intent -> {
            if (intent.getUserId().equals(userId) && intent.getStatus() == PaymentIntentStatus.CREATED) {
                intent.setStatus(PaymentIntentStatus.FAILED);
                intentRepository.save(intent);
            }
        });
    }

    /** Tells the frontend whether online payment is available (keys configured). */
    public boolean isOnlineEnabled() {
        return StringUtils.hasText(keyId) && StringUtils.hasText(keySecret);
    }

    private void ensureConfigured() {
        if (!isOnlineEnabled()) {
            throw ApiException.badRequest("Online payment is not configured yet. Please use Cash on Delivery.");
        }
    }

    private String writeItems(List<PricedLine> lines) {
        try {
            return objectMapper.writeValueAsString(lines);
        } catch (Exception e) {
            throw ApiException.badRequest("Could not prepare the payment.");
        }
    }

    private List<PricedLine> readItems(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<List<PricedLine>>() {});
        } catch (Exception e) {
            throw ApiException.badRequest("Could not read the payment details.");
        }
    }
}
