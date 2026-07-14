package com.emart.controller.admin;

import com.emart.dto.CustomerResponse;
import com.emart.service.CustomerService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Admin customer directory (P1-ADMIN-07).
 */
@RestController
@RequestMapping("/api/admin/customers")
@PreAuthorize("hasRole('ADMIN')")
public class AdminCustomerController {

    private final CustomerService customerService;

    public AdminCustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    @GetMapping
    public ResponseEntity<List<CustomerResponse>> list(@RequestParam(required = false) String search) {
        return ResponseEntity.ok(customerService.listCustomers(search));
    }
}
