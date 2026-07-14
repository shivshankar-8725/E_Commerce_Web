package com.emart.controller.admin;

import com.emart.dto.DealerResponse;
import com.emart.dto.RejectDealerRequest;
import com.emart.service.DealerService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Admin dealer approval (P2-DEAL-02). List pending/all dealers, approve, reject with reason.
 */
@RestController
@RequestMapping("/api/admin/dealers")
@PreAuthorize("hasRole('ADMIN')")
public class AdminDealerController {

    private final DealerService dealerService;

    public AdminDealerController(DealerService dealerService) {
        this.dealerService = dealerService;
    }

    /** ?status=PENDING|APPROVED|REJECTED ; omit for all dealers. */
    @GetMapping
    public ResponseEntity<List<DealerResponse>> list(@RequestParam(required = false) String status) {
        return ResponseEntity.ok(dealerService.list(status));
    }

    @PatchMapping("/{id}/approve")
    public ResponseEntity<DealerResponse> approve(@PathVariable Long id) {
        return ResponseEntity.ok(dealerService.approve(id));
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<DealerResponse> reject(@PathVariable Long id,
                                                 @Valid @RequestBody RejectDealerRequest req) {
        return ResponseEntity.ok(dealerService.reject(id, req.reason()));
    }
}
