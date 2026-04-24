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
}
