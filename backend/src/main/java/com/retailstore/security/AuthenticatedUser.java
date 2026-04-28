package com.retailstore.security;

public record AuthenticatedUser(Long id, String email, String role, Long storeId) {
    public boolean isAdmin() {
        return "admin".equalsIgnoreCase(role);
    }
}

