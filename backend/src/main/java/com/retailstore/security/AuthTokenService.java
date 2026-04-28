package com.retailstore.security;

import com.retailstore.model.User;
import com.retailstore.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthTokenService {

    private static final String HMAC_ALGO = "HmacSHA256";

    private final UserRepository userRepository;
    private final byte[] secretKey;
    private final long tokenTtlMillis;

    public AuthTokenService(
            UserRepository userRepository,
            @Value("${app.auth.token-secret:change-me-in-production}") String tokenSecret,
            @Value("${app.auth.token-ttl-minutes:720}") long tokenTtlMinutes
    ) {
        this.userRepository = userRepository;
        this.secretKey = tokenSecret.getBytes(StandardCharsets.UTF_8);
        this.tokenTtlMillis = Math.max(1, tokenTtlMinutes) * 60_000L;
    }

    public String generateToken(User user) {
        long expiresAt = System.currentTimeMillis() + tokenTtlMillis;
        String nonce = UUID.randomUUID().toString().replace("-", "");
        String payload = user.getId() + ":" + expiresAt + ":" + nonce;
        String payloadB64 = Base64.getUrlEncoder().withoutPadding()
                .encodeToString(payload.getBytes(StandardCharsets.UTF_8));
        return payloadB64 + "." + sign(payloadB64);
    }

    public Optional<AuthenticatedUser> parseToken(String token) {
        if (token == null || token.isBlank()) {
            return Optional.empty();
        }

        String[] parts = token.split("\\.", 2);
        if (parts.length != 2) {
            return Optional.empty();
        }

        String payloadB64 = parts[0];
        String signature = parts[1];
        String expected = sign(payloadB64);
        if (!MessageDigest.isEqual(
                signature.getBytes(StandardCharsets.UTF_8),
                expected.getBytes(StandardCharsets.UTF_8))
        ) {
            return Optional.empty();
        }

        try {
            String payload = new String(Base64.getUrlDecoder().decode(payloadB64), StandardCharsets.UTF_8);
            String[] fields = payload.split(":");
            if (fields.length < 2) {
                return Optional.empty();
            }

            Long userId = Long.parseLong(fields[0]);
            long expiresAt = Long.parseLong(fields[1]);
            if (System.currentTimeMillis() > expiresAt) {
                return Optional.empty();
            }

            return userRepository.findById(userId)
                    .filter(this::isAllowedStatus)
                    .map(user -> new AuthenticatedUser(user.getId(), user.getEmail(), user.getRole(), user.getStoreId()));
        } catch (Exception ignored) {
            return Optional.empty();
        }
    }

    private boolean isAllowedStatus(User user) {
        String status = user.getStatus() == null ? "" : user.getStatus().toLowerCase();
        return "approved".equals(status) || "active".equals(status);
    }

    private String sign(String payloadB64) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGO);
            mac.init(new SecretKeySpec(secretKey, HMAC_ALGO));
            byte[] signature = mac.doFinal(payloadB64.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(signature);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to sign auth token", e);
        }
    }
}

