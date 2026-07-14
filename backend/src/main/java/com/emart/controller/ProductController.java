package com.emart.controller;

import com.emart.dto.ProductResponse;
import com.emart.service.ProductService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Public catalogue endpoints (P1-CUST-01/02/03). Read-only, no auth required.
 */
@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public ResponseEntity<List<ProductResponse>> list(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(productService.listForCustomers(categoryId, search));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductResponse> detail(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getForCustomer(id));
    }
}
