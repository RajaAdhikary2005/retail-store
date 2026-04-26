package com.retailstore.controller;

import com.retailstore.model.Store;
import com.retailstore.model.User;
import com.retailstore.repository.StoreRepository;
import com.retailstore.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StoreRepository storeRepository;

    @Autowired
    private org.springframework.mail.javamail.JavaMailSender mailSender;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody Map<String, Object> body) {
        String email = (String) body.get("email");
        String password = (String) body.get("password");
        String name = (String) body.get("name");
        String role = (String) body.getOrDefault("role", "staff");
        String avatar = (String) body.getOrDefault("avatar", "U");
        String status = (String) body.getOrDefault("status", "pending");
        String storeName = (String) body.get("storeName");
        Number storeIdNum = (Number) body.get("storeId");

        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.badRequest().body("Email already in use");
        }

        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setName(name);
        user.setRole(role);
        user.setAvatar(avatar);

        if ("admin".equals(role)) {
            // Admin signup: create store and auto-approve
            user.setStatus("approved");

            if (storeName != null && !storeName.trim().isEmpty()) {
                Store store = new Store();
                store.setName(storeName.trim());
                store.setAdminEmail(email);
                Store savedStore = storeRepository.save(store);
                user.setStoreId(savedStore.getId());
            }
        } else {
            // Manager/Staff signup: pending approval
            user.setStatus(status);
            if (storeIdNum != null) {
                user.setStoreId(storeIdNum.longValue());
            }
        }

        User savedUser = userRepository.save(user);

        Map<String, Object> response = new HashMap<>();
        response.put("id", savedUser.getId());
        response.put("name", savedUser.getName());
        response.put("email", savedUser.getEmail());
        response.put("role", savedUser.getRole());
        response.put("avatar", savedUser.getAvatar());
        response.put("storeId", savedUser.getStoreId());
        response.put("status", savedUser.getStatus());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String email = credentials.get("email");
        String password = credentials.get("password");

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

                Map<String, Object> response = new HashMap<>();
                response.put("name", user.getName());
                response.put("email", user.getEmail());
                response.put("role", user.getRole());
                response.put("avatar", user.getAvatar());
                response.put("storeId", user.getStoreId());
                response.put("status", user.getStatus());

                return ResponseEntity.ok(response);
            }
        }
        return ResponseEntity.status(401).body("Invalid email or password");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Email required");
        }

        Optional<User> userOpt = userRepository.findByEmail(email.trim().toLowerCase());
        if (!userOpt.isPresent()) {
            return ResponseEntity.ok(Map.of("message", "If the email exists, an OTP has been sent."));
        }

        User user = userOpt.get();
        // Generate a 6-digit OTP
        String otp = String.format("%06d", new java.util.Random().nextInt(999999));
        user.setResetOtp(otp);
        user.setResetOtpExpiry(java.time.LocalDateTime.now().plusMinutes(10));
        userRepository.save(user);

        // Fetch Store and Admin details
        String storeName = "Retail Store";
        String adminName = "System Admin";
        if (user.getStoreId() != null) {
            Optional<Store> storeOpt = storeRepository.findById(user.getStoreId());
            if (storeOpt.isPresent()) {
                Store store = storeOpt.get();
                storeName = store.getName();
                Optional<User> adminOpt = userRepository.findByEmail(store.getAdminEmail());
                if (adminOpt.isPresent()) adminName = adminOpt.get().getName();
            }
        }

        // Send email
        try {
            jakarta.mail.internet.MimeMessage message = mailSender.createMimeMessage();
            org.springframework.mail.javamail.MimeMessageHelper helper = new org.springframework.mail.javamail.MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom("rajaadhikary002@gmail.com");
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
                    + "Retail Store Management System Developed by: <b>Raja Adhikary</b>"
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
        String email = body.get("email");
        String otp = body.get("otp");
        if (email == null || otp == null) return ResponseEntity.badRequest().body("Email and OTP required");

        Optional<User> userOpt = userRepository.findByEmail(email.trim().toLowerCase());
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (otp.equals(user.getResetOtp()) && user.getResetOtpExpiry() != null && user.getResetOtpExpiry().isAfter(java.time.LocalDateTime.now())) {
                return ResponseEntity.ok(Map.of("message", "OTP verified"));
            }
        }
        return ResponseEntity.status(400).body("Invalid or expired OTP");
    }

    @PostMapping("/set-new-password")
    public ResponseEntity<?> setNewPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String otp = body.get("otp");
        String newPassword = body.get("newPassword");
        
        if (email == null || otp == null || newPassword == null || newPassword.length() < 6) {
            return ResponseEntity.badRequest().body("Invalid request or password too short");
        }

        Optional<User> userOpt = userRepository.findByEmail(email.trim().toLowerCase());
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (otp.equals(user.getResetOtp()) && user.getResetOtpExpiry() != null && user.getResetOtpExpiry().isAfter(java.time.LocalDateTime.now())) {
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
    public ResponseEntity<?> getAllUsers(@RequestParam(required = false) Long storeId) {
        if (storeId != null) {
            return ResponseEntity.ok(userRepository.findByStoreId(storeId));
        }
        return ResponseEntity.ok(userRepository.findAll());
    }

    @PutMapping("/users/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String status = body.get("status");
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setStatus(status);
            userRepository.save(user);
            return ResponseEntity.ok(user);
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<?> updateRole(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String role = body.get("role");
        if (role == null || (!role.equals("admin") && !role.equals("manager") && !role.equals("staff"))) {
            return ResponseEntity.badRequest().body("Invalid role");
        }
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setRole(role);
            userRepository.save(user);
            return ResponseEntity.ok(user);
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isPresent()) {
            userRepository.delete(userOpt.get());
            return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/update-profile")
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, String> body) {
        String currentEmail = body.get("currentEmail");
        String newName = body.get("name");
        String newEmail = body.get("email");

        Optional<User> userOpt = userRepository.findByEmail(currentEmail);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();

        if (newEmail != null && !newEmail.equals(currentEmail)) {
            if (userRepository.findByEmail(newEmail).isPresent()) {
                return ResponseEntity.badRequest().body("Email already in use");
            }
            user.setEmail(newEmail);
        }

        if (newName != null && !newName.trim().isEmpty()) {
            user.setName(newName.trim());
            String[] parts = newName.trim().split(" ");
            String avatar = parts.length > 1
                ? ("" + parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
                : newName.trim().substring(0, Math.min(2, newName.trim().length())).toUpperCase();
            user.setAvatar(avatar);
        }

        User saved = userRepository.save(user);

        Map<String, Object> response = new HashMap<>();
        response.put("name", saved.getName());
        response.put("email", saved.getEmail());
        response.put("role", saved.getRole());
        response.put("avatar", saved.getAvatar());
        response.put("storeId", saved.getStoreId());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/update-password")
    public ResponseEntity<?> updatePassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String currentPassword = body.get("currentPassword");
        String newPassword = body.get("newPassword");

        if (email == null || currentPassword == null || newPassword == null) {
            return ResponseEntity.badRequest().body("All fields are required");
        }
        if (newPassword.length() < 6) {
            return ResponseEntity.badRequest().body("New password must be at least 6 characters");
        }

        Optional<User> userOpt = userRepository.findByEmail(email);
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
}
