package com.retailstore.controller;

import com.retailstore.model.Store;
import com.retailstore.model.User;
import com.retailstore.repository.StoreRepository;
import com.retailstore.repository.UserRepository;
import com.retailstore.security.AuthTokenService;
import com.retailstore.security.AuthenticatedUser;
import com.retailstore.security.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Set<String> ALLOWED_ROLES = Set.of("admin", "manager", "staff");
    private static final Set<String> ALLOWED_STATUSES = Set.of("pending", "approved", "rejected", "suspended", "active");

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StoreRepository storeRepository;

    @Autowired
    private org.springframework.mail.javamail.JavaMailSender mailSender;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthTokenService authTokenService;

    @Autowired
    private SecurityUtils securityUtils;

    @Value("${spring.mail.username:noreply@retailstore.local}")
    private String mailFrom;

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody Map<String, Object> body) {
        String email = normalizeEmail((String) body.get("email"));
        String password = (String) body.get("password");
        String name = safeTrim((String) body.get("name"));
        String role = safeTrim((String) body.getOrDefault("role", "staff")).toLowerCase();
        String avatar = safeTrim((String) body.getOrDefault("avatar", "U"));
        String storeName = safeTrim((String) body.get("storeName"));
        Number storeIdNum = (Number) body.get("storeId");

        if (email == null || password == null || password.length() < 6 || name == null || name.isBlank()) {
            return ResponseEntity.badRequest().body("Name, valid email, and password (min 6 chars) are required");
        }
        if (!ALLOWED_ROLES.contains(role)) {
            return ResponseEntity.badRequest().body("Invalid role");
        }
        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.badRequest().body("Email already in use");
        }

        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setName(name);
        user.setRole(role);
        user.setAvatar(avatar.isBlank() ? initialsFor(name) : avatar);

        if ("admin".equals(role)) {
            if (storeName == null || storeName.isBlank()) {
                return ResponseEntity.badRequest().body("Store name is required for admin signup");
            }
            user.setStatus("approved");
            Store store = new Store();
            store.setName(storeName);
            store.setAdminEmail(email);
            Store savedStore = storeRepository.save(store);
            user.setStoreId(savedStore.getId());
        } else {
            if (storeIdNum == null) {
                return ResponseEntity.badRequest().body("Store selection is required");
            }
            long requestedStoreId = storeIdNum.longValue();
            if (!storeRepository.existsById(requestedStoreId)) {
                return ResponseEntity.badRequest().body("Selected store does not exist");
            }
            user.setStoreId(requestedStoreId);
            user.setStatus("pending");
        }

        User savedUser = userRepository.save(user);
        return ResponseEntity.ok(toUserResponse(savedUser));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String email = normalizeEmail(credentials.get("email"));
        String password = credentials.get("password");
        if (email == null || password == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid email or password");
        }

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (passwordEncoder.matches(password, user.getPassword())) {
                if ("rejected".equals(user.getStatus())) {
                    return ResponseEntity.status(403).body("Your account has been rejected.");
                }
                if ("suspended".equals(user.getStatus())) {
                    return ResponseEntity.status(403).body("Your account has been suspended. Contact your admin.");
                }
                if ("pending".equals(user.getStatus())) {
                    return ResponseEntity.status(403).body("Your account is pending approval. Please wait for admin to approve.");
                }

                Map<String, Object> response = toUserResponse(user);
                response.put("token", authTokenService.generateToken(user));
                return ResponseEntity.ok(response);
            }
        }
        return ResponseEntity.status(401).body("Invalid email or password");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        String email = normalizeEmail(body.get("email"));
        if (email == null) {
            return ResponseEntity.badRequest().body("Email required");
        }

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.ok(Map.of("message", "If the email exists, an OTP has been sent."));
        }

        User user = userOpt.get();
        String otp = String.format("%06d", new java.util.Random().nextInt(999999));
        user.setResetOtp(otp);
        user.setResetOtpExpiry(LocalDateTime.now().plusMinutes(10));
        userRepository.save(user);

        String storeName = "Retail Store";
        String adminName = "System Admin";
        if (user.getStoreId() != null) {
            Optional<Store> storeOpt = storeRepository.findById(user.getStoreId());
            if (storeOpt.isPresent()) {
                Store store = storeOpt.get();
                storeName = store.getName();
                Optional<User> adminOpt = userRepository.findByEmail(store.getAdminEmail());
                if (adminOpt.isPresent()) {
                    adminName = adminOpt.get().getName();
                }
            }
        }

        try {
            jakarta.mail.internet.MimeMessage message = mailSender.createMimeMessage();
            org.springframework.mail.javamail.MimeMessageHelper helper =
                    new org.springframework.mail.javamail.MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(mailFrom);
            helper.setTo(user.getEmail());
            helper.setSubject(storeName + " - Password Reset OTP");

            String htmlContent = "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; border: 1px solid #eaeaea; border-radius: 10px;'>"
                    + "<div style='text-align: center; margin-bottom: 20px;'>"
                    + "<img src='https://retail-store-gilt.vercel.app/retailstore-logo.png' alt='Retail Store Logo' style='max-width: 180px;'/>"
                    + "</div>"
                    + "<h2 style='color: #1f2937;'>Hello " + user.getName() + ",</h2>"
                    + "<p style='font-size: 15px; line-height: 1.5;'>We received a request to reset your password for your account at <b>" + storeName + "</b>.</p>"
                    + "<p style='font-size: 15px;'>Your One-Time Password (OTP) to reset your password is:</p>"
                    + "<div style='font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #2563eb; background: #eff6ff; padding: 15px; text-align: center; border-radius: 8px; margin: 25px 0;'>" + otp + "</div>"
                    + "<p style='font-size: 13px; color: #6b7280; text-align: center; margin-top: -15px;'><i>(This code is valid for 10 minutes)</i></p>"
                    + "<p style='font-size: 14px; line-height: 1.5; color: #4b5563; background: #fffbeb; padding: 12px; border-left: 4px solid #f59e0b; margin: 25px 0;'>"
                    + "If you did not request this password reset, please ignore this email. Your account is still secure. However, if you suspect someone is trying to access your account, please log in and change your password immediately.</p>"
                    + "<hr style='border: none; border-top: 1px solid #eaeaea; margin: 25px 0;'/>"
                    + "<p style='font-size: 15px;'>Thank you for choosing <b>" + storeName + "</b>!</p>"
                    + "<p style='font-size: 15px; line-height: 1.5;'>Best Regards,<br/><b>" + adminName + "</b> (Store Admin)</p>"
                    + "<div style='text-align: center; margin-top: 30px; font-size: 12px; color: #9ca3af;'>"
                    + "Retail Store Management System"
                    + "</div>"
                    + "</div>";

            helper.setText(htmlContent, true);
            mailSender.send(message);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Failed to send email. Check SMTP settings.");
        }

        return ResponseEntity.ok(Map.of("message", "If the email exists, an OTP has been sent."));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> body) {
        String email = normalizeEmail(body.get("email"));
        String otp = body.get("otp");
        if (email == null || otp == null) {
            return ResponseEntity.badRequest().body("Email and OTP required");
        }

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (otp.equals(user.getResetOtp()) && user.getResetOtpExpiry() != null
                    && user.getResetOtpExpiry().isAfter(LocalDateTime.now())) {
                return ResponseEntity.ok(Map.of("message", "OTP verified"));
            }
        }
        return ResponseEntity.status(400).body("Invalid or expired OTP");
    }

    @PostMapping("/set-new-password")
    public ResponseEntity<?> setNewPassword(@RequestBody Map<String, String> body) {
        String email = normalizeEmail(body.get("email"));
        String otp = body.get("otp");
        String newPassword = body.get("newPassword");

        if (email == null || otp == null || newPassword == null || newPassword.length() < 6) {
            return ResponseEntity.badRequest().body("Invalid request or password too short");
        }

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (otp.equals(user.getResetOtp()) && user.getResetOtpExpiry() != null
                    && user.getResetOtpExpiry().isAfter(LocalDateTime.now())) {
                user.setPassword(passwordEncoder.encode(newPassword));
                user.setResetOtp(null);
                user.setResetOtpExpiry(null);
                userRepository.save(user);
                return ResponseEntity.ok(Map.of("message", "Password reset successfully"));
            }
        }
        return ResponseEntity.status(400).body("Invalid or expired OTP");
    }

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        securityUtils.requireAdmin();
        Long storeId = securityUtils.currentStoreId();
        List<Map<String, Object>> users = userRepository.findByStoreId(storeId)
                .stream()
                .map(this::toUserResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    @PutMapping("/users/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        securityUtils.requireAdmin();
        String rawStatus = safeTrim(body.get("status"));
        if (rawStatus == null) {
            return ResponseEntity.badRequest().body("Invalid status");
        }
        String status = rawStatus.toLowerCase();
        if (!ALLOWED_STATUSES.contains(status)) {
            return ResponseEntity.badRequest().body("Invalid status");
        }

        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();
        securityUtils.ensureSameStore(user.getStoreId());
        user.setStatus(status);
        userRepository.save(user);
        return ResponseEntity.ok(toUserResponse(user));
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<?> updateRole(@PathVariable Long id, @RequestBody Map<String, String> body) {
        securityUtils.requireAdmin();
        String rawRole = safeTrim(body.get("role"));
        if (rawRole == null) {
            return ResponseEntity.badRequest().body("Invalid role");
        }
        String role = rawRole.toLowerCase();
        if (!ALLOWED_ROLES.contains(role)) {
            return ResponseEntity.badRequest().body("Invalid role");
        }

        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();
        securityUtils.ensureSameStore(user.getStoreId());
        user.setRole(role);
        userRepository.save(user);
        return ResponseEntity.ok(toUserResponse(user));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        securityUtils.requireAdmin();
        AuthenticatedUser currentUser = securityUtils.currentUser();

        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();
        securityUtils.ensureSameStore(user.getStoreId());

        if (currentUser.id().equals(user.getId())) {
            return ResponseEntity.badRequest().body("You cannot delete your own account");
        }
        if ("admin".equalsIgnoreCase(user.getRole())) {
            return ResponseEntity.badRequest().body("Admin users cannot be deleted from this endpoint");
        }

        userRepository.delete(user);
        return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
    }

    @PutMapping("/update-profile")
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, String> body) {
        AuthenticatedUser current = securityUtils.currentUser();
        Optional<User> userOpt = userRepository.findById(current.id());
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();
        String newName = safeTrim(body.get("name"));
        String newEmail = normalizeEmail(body.get("email"));

        if (newEmail != null && !newEmail.equals(user.getEmail())) {
            if (userRepository.findByEmail(newEmail).isPresent()) {
                return ResponseEntity.badRequest().body("Email already in use");
            }
            user.setEmail(newEmail);
        }

        if (newName != null && !newName.isBlank()) {
            user.setName(newName);
            user.setAvatar(initialsFor(newName));
        }

        User saved = userRepository.save(user);
        return ResponseEntity.ok(toUserResponse(saved));
    }

    @PutMapping("/update-password")
    public ResponseEntity<?> updatePassword(@RequestBody Map<String, String> body) {
        AuthenticatedUser current = securityUtils.currentUser();
        String currentPassword = body.get("currentPassword");
        String newPassword = body.get("newPassword");

        if (currentPassword == null || newPassword == null) {
            return ResponseEntity.badRequest().body("All fields are required");
        }
        if (newPassword.length() < 6) {
            return ResponseEntity.badRequest().body("New password must be at least 6 characters");
        }

        Optional<User> userOpt = userRepository.findById(current.id());
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            return ResponseEntity.badRequest().body("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        return ResponseEntity.ok("Password updated successfully");
    }

    private Map<String, Object> toUserResponse(User user) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("name", user.getName());
        response.put("email", user.getEmail());
        response.put("role", user.getRole());
        response.put("avatar", user.getAvatar());
        response.put("storeId", user.getStoreId());
        response.put("status", user.getStatus());
        return response;
    }

    private String normalizeEmail(String email) {
        String trimmed = safeTrim(email);
        return trimmed == null || trimmed.isBlank() ? null : trimmed.toLowerCase();
    }

    private String safeTrim(String value) {
        return value == null ? null : value.trim();
    }

    private String initialsFor(String name) {
        if (name == null || name.isBlank()) {
            return "U";
        }
        String[] parts = name.trim().split("\\s+");
        if (parts.length >= 2) {
            return ("" + parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
        }
        return name.substring(0, Math.min(2, name.length())).toUpperCase();
    }
}
