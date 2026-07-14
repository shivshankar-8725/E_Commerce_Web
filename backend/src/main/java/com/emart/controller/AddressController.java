package com.emart.controller;

import com.emart.dto.AddressRequest;
import com.emart.dto.AddressResponse;
import com.emart.security.SecurityUtils;
import com.emart.service.AddressService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Customer address book (P1-CUST-05). Requires authentication; scoped to current user.
 */
@RestController
@RequestMapping("/api/addresses")
public class AddressController {

    private final AddressService addressService;

    public AddressController(AddressService addressService) {
        this.addressService = addressService;
    }

    @GetMapping
    public ResponseEntity<List<AddressResponse>> list() {
        return ResponseEntity.ok(addressService.listForUser(SecurityUtils.currentUserId()));
    }

    @PostMapping
    public ResponseEntity<AddressResponse> create(@Valid @RequestBody AddressRequest req) {
        return ResponseEntity.ok(addressService.create(SecurityUtils.currentUserId(), req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AddressResponse> update(@PathVariable Long id, @Valid @RequestBody AddressRequest req) {
        return ResponseEntity.ok(addressService.update(SecurityUtils.currentUserId(), id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<java.util.Map<String, String>> delete(@PathVariable Long id) {
        addressService.delete(SecurityUtils.currentUserId(), id);
        return ResponseEntity.ok(java.util.Map.of("message", "Address deleted."));
    }
}
