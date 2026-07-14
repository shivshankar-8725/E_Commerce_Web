package com.emart.controller.admin;

import com.emart.dto.PincodeRequest;
import com.emart.dto.PincodeResponse;
import com.emart.service.PincodeService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Admin delivery-area (pincode) management (P1-SYS-01).
 */
@RestController
@RequestMapping("/api/admin/pincodes")
@PreAuthorize("hasRole('ADMIN')")
public class AdminPincodeController {

    private final PincodeService pincodeService;

    public AdminPincodeController(PincodeService pincodeService) {
        this.pincodeService = pincodeService;
    }

    @GetMapping
    public ResponseEntity<List<PincodeResponse>> list() {
        return ResponseEntity.ok(pincodeService.listAll());
    }

    @PostMapping
    public ResponseEntity<PincodeResponse> create(@Valid @RequestBody PincodeRequest req) {
        return ResponseEntity.ok(pincodeService.create(req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PincodeResponse> update(@PathVariable Long id, @Valid @RequestBody PincodeRequest req) {
        return ResponseEntity.ok(pincodeService.update(id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        pincodeService.delete(id);
        return ResponseEntity.ok(Map.of("message", "Pincode removed from delivery list."));
    }
}
