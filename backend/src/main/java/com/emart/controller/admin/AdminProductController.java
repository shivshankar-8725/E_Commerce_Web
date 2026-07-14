package com.emart.controller.admin;

import com.emart.dto.ProductRequest;
import com.emart.dto.ProductResponse;
import com.emart.service.FileStorageService;
import com.emart.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

/**
 * Admin product management (P1-ADMIN-01/02). ADMIN role enforced at URL + method level.
 */
@RestController
@RequestMapping("/api/admin/products")
@PreAuthorize("hasRole('ADMIN')")
public class AdminProductController {

    private final ProductService productService;
    private final FileStorageService fileStorageService;

    public AdminProductController(ProductService productService, FileStorageService fileStorageService) {
        this.productService = productService;
        this.fileStorageService = fileStorageService;
    }

    @GetMapping
    public ResponseEntity<List<ProductResponse>> list() {
        return ResponseEntity.ok(productService.listAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductResponse> get(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getById(id));
    }

    @PostMapping
    public ResponseEntity<ProductResponse> create(@Valid @RequestBody ProductRequest req) {
        return ResponseEntity.ok(productService.create(req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductResponse> update(@PathVariable Long id, @Valid @RequestBody ProductRequest req) {
        return ResponseEntity.ok(productService.update(id, req));
    }

    /** Soft-delete: deactivate instead of hard delete. */
    @DeleteMapping("/{id}")
    public ResponseEntity<ProductResponse> deactivate(@PathVariable Long id) {
        return ResponseEntity.ok(productService.deactivate(id));
    }

    /** P1-ADMIN-02: set stock quantity directly. */
    @PatchMapping("/{id}/stock")
    public ResponseEntity<ProductResponse> setStock(@PathVariable Long id, @RequestBody Map<String, Integer> body) {
        Integer stock = body.get("stockQty");
        return ResponseEntity.ok(productService.setStock(id, stock == null ? 0 : stock));
    }

    /** Image upload; returns { imageUrl } to store on the product. */
    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> upload(@RequestParam("file") MultipartFile file) {
        String url = fileStorageService.store(file);
        return ResponseEntity.ok(Map.of("imageUrl", url));
    }
}
