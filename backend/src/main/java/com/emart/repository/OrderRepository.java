package com.emart.repository;

import com.emart.entity.Order;
import com.emart.entity.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collection;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Order> findAllByOrderByCreatedAtDesc();

    boolean existsByOrderNumber(String orderNumber);

    boolean existsByAddressId(Long addressId);

    boolean existsByAddressIdAndStatusIn(Long addressId, Collection<OrderStatus> statuses);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.createdAt >= :start AND o.createdAt < :end")
    long countOrdersBetween(@Param("start") Instant start, @Param("end") Instant end);

    // Sales count excludes rejected orders (P4-RPT-01)
    @Query("SELECT COUNT(o) FROM Order o WHERE o.createdAt >= :start AND o.createdAt < :end " +
           "AND o.status <> com.emart.entity.OrderStatus.REJECTED")
    long countSalesBetween(@Param("start") Instant start, @Param("end") Instant end);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o " +
           "WHERE o.createdAt >= :start AND o.createdAt < :end AND o.status <> com.emart.entity.OrderStatus.REJECTED")
    BigDecimal sumOrderAmountBetween(@Param("start") Instant start, @Param("end") Instant end);
}
