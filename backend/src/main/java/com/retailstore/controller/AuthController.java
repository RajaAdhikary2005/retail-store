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
            return ResponseEntity.ok(Map.of("message", "If the email exists, a reset link has been sent."));
        }

        User user = userOpt.get();
        // Generate a new 8-character temporary password
        String tempPassword = java.util.UUID.randomUUID().toString().substring(0, 8);
        user.setPassword(passwordEncoder.encode(tempPassword));
        userRepository.save(user);

        // Send email
        try {
            org.springframework.mail.SimpleMailMessage message = new org.springframework.mail.SimpleMailMessage();
            message.setFrom("rajaadhikary002@gmail.com");
            message.setTo(user.getEmail());
            message.setSubject("Retail Store - Password Reset");
            message.setText("Hello " + user.getName() + ",\n\nYour password has been reset. Your temporary password is: " + tempPassword + "\n\nPlease login using this temporary password and you can change it later in settings.");
            mailSender.send(message);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Failed to send email. Check SMTP settings.");
        }

        return ResponseEntity.ok(Map.of("message", "If the email exists, a password reset email has been sent."));
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
