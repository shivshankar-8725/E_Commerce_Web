package com.emart.security;

/**
 * Lightweight authenticated principal carried in the SecurityContext after JWT validation.
 * Controllers read the current user id/role from this without another DB hit.
 */
public record JwtPrincipal(Long userId, String mobile, String role) {
}
