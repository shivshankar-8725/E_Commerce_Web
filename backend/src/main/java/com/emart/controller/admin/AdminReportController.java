package com.emart.controller.admin;

import com.emart.dto.SalesReportResponse;
import com.emart.service.ReportService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

/**
 * Admin sales reports (P4-RPT-01).
 */
@RestController
@RequestMapping("/api/admin/reports")
@PreAuthorize("hasRole('ADMIN')")
public class AdminReportController {

    private final ReportService reportService;

    public AdminReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    /** GET /api/admin/reports/sales?from=2026-06-01&to=2026-06-27&limit=5 */
    @GetMapping("/sales")
    public ResponseEntity<SalesReportResponse> sales(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "5") int limit) {
        return ResponseEntity.ok(reportService.salesReport(from, to, limit));
    }
}
