package com.emart.repository;

import com.emart.entity.PaymentIntent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PaymentIntentRepository extends JpaRepository<PaymentIntent, Long> {
    Optional<PaymentIntent> findByRazorpayOrderId(String razorpayOrderId);
}
