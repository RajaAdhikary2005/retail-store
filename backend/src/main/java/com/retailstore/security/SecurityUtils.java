package com.retailstore.security;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class SecurityUtils {

    public AuthenticatedUser currentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUser user)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return user;
    }

    public Long currentStoreId() {
        AuthenticatedUser user = currentUser();
        if (user.storeId() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No store is associated with this account");
        }
        return user.storeId();
    }

    public void requireAdmin() {
        AuthenticatedUser user = currentUser();
        if (!user.isAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access required");
        }
    }

    public void ensureSameStore(Long storeId) {
        Long currentStoreId = currentStoreId();
        if (storeId == null || !currentStoreId.equals(storeId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied for this store");
        }
    }
}

