package com.emart.controller;

import com.emart.service.PincodeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Public pincode delivery-area check (P1-CUST-05).
 */
@RestController
@RequestMapping("/api/pincodes")
public class PincodeController {

    private final PincodeService pincodeService;

    public PincodeController(PincodeService pincodeService) {
        this.pincodeService = pincodeService;
    }

    @GetMapping("/check/{pincode}")
    public ResponseEntity<Map<String, Object>> check(@PathVariable String pincode) {
        boolean allowed = pincodeService.isAllowed(pincode);
        return ResponseEntity.ok(Map.of(
                "pincode", pincode,
                "allowed", allowed,
                "message", allowed
                        ? "Delivery available for this pincode."
                        : "Sorry, we do not deliver to this pincode yet."
        ));
    }
}
