package com.emart.controller;

import com.emart.security.JwtPrincipal;
import com.emart.security.SecurityUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Returns the currently authenticated user (used by the frontend to validate the token on load).
 */
@RestController
@RequestMapping("/api/me")
public class MeController {

    @GetMapping
    public ResponseEntity<Map<String, Object>> me() {
        JwtPrincipal p = SecurityUtils.currentPrincipal();
        return ResponseEntity.ok(Map.of(
                "userId", p.userId(),
                "mobile", p.mobile(),
                "role", p.role()
        ));
    }
}
