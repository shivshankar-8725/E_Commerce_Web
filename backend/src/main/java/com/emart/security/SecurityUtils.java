package com.emart.security;

import com.emart.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Helper to read the authenticated user from the SecurityContext.
 */
public final class SecurityUtils {

    private SecurityUtils() {}

    public static JwtPrincipal currentPrincipal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof JwtPrincipal principal)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Not authenticated.");
        }
        return principal;
    }

    public static Long currentUserId() {
        return currentPrincipal().userId();
    }

    /** Returns the current user's role, or null if the request is unauthenticated. */
    public static String currentRoleOrNull() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof JwtPrincipal principal) {
            return principal.role();
        }
        return null;
    }
}
