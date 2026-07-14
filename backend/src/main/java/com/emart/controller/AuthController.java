package com.emart.controller;

import com.emart.dto.AuthResponse;
import com.emart.dto.DealerRegisterRequest;
import com.emart.dto.LoginRequest;
import com.emart.dto.RegisterRequest;
import com.emart.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /** P1-AUTH-01: customer self-registration. */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest req) {
        return ResponseEntity.ok(authService.registerCustomer(req));
    }

    /** P2-DEAL-01: dealer self-registration (no token; awaits admin approval). */
    @PostMapping("/register-dealer")
    public ResponseEntity<Map<String, String>> registerDealer(@Valid @RequestBody DealerRegisterRequest req) {
        authService.registerDealer(req);
        return ResponseEntity.ok(Map.of(
                "message", "Registration received. Your dealer account is pending admin approval."));
    }

    /** P1-AUTH-02 / P1-AUTH-03 / P2-DEAL-02: login (customer, admin or approved dealer). */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }
}
