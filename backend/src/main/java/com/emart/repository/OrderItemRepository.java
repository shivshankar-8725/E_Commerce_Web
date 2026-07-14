package com.emart.repository;

import com.emart.dto.TopProductRow;
import com.emart.entity.OrderItem;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    /**
     * Top-selling products in a date range (P4-RPT-01). Rejected orders are excluded.
     * Ordered by quantity sold; limit applied via Pageable.
     */
    @Query("SELECT new com.emart.dto.TopProductRow(" +
           "  oi.product.id, oi.product.name, SUM(oi.quantity), SUM(oi.priceAtOrder * oi.quantity)) " +
           "FROM OrderItem oi " +
           "WHERE oi.order.createdAt >= :start AND oi.order.createdAt < :end " +
           "  AND oi.order.status <> com.emart.entity.OrderStatus.REJECTED " +
           "GROUP BY oi.product.id, oi.product.name " +
           "ORDER BY SUM(oi.quantity) DESC")
    List<TopProductRow> topProducts(@Param("start") Instant start, @Param("end") Instant end, Pageable pageable);
}
