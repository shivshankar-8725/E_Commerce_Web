package com.emart.service;

import com.emart.dto.SalesReportResponse;
import com.emart.dto.TopProductRow;
import com.emart.exception.ApiException;
import com.emart.repository.OrderItemRepository;
import com.emart.repository.OrderRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

@Service
public class ReportService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;

    public ReportService(OrderRepository orderRepository, OrderItemRepository orderItemRepository) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
    }

    /** P4-RPT-01: total orders + total amount + top-selling products for a date range (inclusive). */
    public SalesReportResponse salesReport(LocalDate from, LocalDate to, int limit) {
        if (from == null || to == null) {
            throw ApiException.badRequest("Please provide both 'from' and 'to' dates.");
        }
        if (to.isBefore(from)) {
            throw ApiException.badRequest("'to' date cannot be before 'from' date.");
        }
        if (limit <= 0) limit = 5;

        ZoneId zone = ZoneId.systemDefault();
        Instant start = from.atStartOfDay(zone).toInstant();
        Instant end = to.plusDays(1).atStartOfDay(zone).toInstant(); // inclusive of the 'to' day

        long totalOrders = orderRepository.countSalesBetween(start, end);
        BigDecimal totalAmount = orderRepository.sumOrderAmountBetween(start, end);
        List<TopProductRow> top = orderItemRepository.topProducts(start, end, PageRequest.of(0, limit));

        return new SalesReportResponse(from, to, totalOrders,
                totalAmount != null ? totalAmount : BigDecimal.ZERO, top);
    }
}
