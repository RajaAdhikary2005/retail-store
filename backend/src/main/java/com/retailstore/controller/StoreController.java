package com.retailstore.controller;

import com.retailstore.model.Store;
import com.retailstore.repository.StoreRepository;
import com.retailstore.security.AuthenticatedUser;
import com.retailstore.security.SecurityUtils;
import com.retailstore.service.StoreService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stores")
public class StoreController {

    @Autowired
    private StoreRepository storeRepository;

    @Autowired
    private StoreService storeService;

    @Autowired
    private SecurityUtils securityUtils;

    @GetMapping("/public")
    public ResponseEntity<List<java.util.Map<String, Object>>> getPublicStores() {
        return ResponseEntity.ok(storeRepository.findAll()
                .stream()
                .map(store -> {
                    java.util.Map<String, Object> storeInfo = new java.util.HashMap<>();
                    storeInfo.put("id", store.getId());
                    storeInfo.put("name", store.getName());
                    return storeInfo;
                })
                .toList());
    }

    @GetMapping
    public ResponseEntity<List<Store>> getAllStores() {
        AuthenticatedUser user = securityUtils.currentUser();
        if (user.storeId() == null) {
            return ResponseEntity.ok(List.of());
        }
        return ResponseEntity.ok(storeRepository.findAll()
                .stream()
                .filter(store -> store.getId().equals(user.storeId()))
                .toList());
    }

    @PostMapping
    public ResponseEntity<Store> createStore(@RequestBody Store store) {
        securityUtils.requireAdmin();
        AuthenticatedUser user = securityUtils.currentUser();
        store.setAdminEmail(user.email());
        Store saved = storeRepository.save(store);
        return ResponseEntity.ok(saved);
    }

    /**
     * DELETE /api/stores/{id}
     * Deletes a store and ALL its data (users, products, orders, customers, etc.)
     * Other stores remain completely unaffected.
     * Only the admin of the store should call this.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteStore(@PathVariable Long id) {
        securityUtils.requireAdmin();
        if (!securityUtils.currentStoreId().equals(id)) {
            return ResponseEntity.status(403).body("You can only delete your own store");
        }
        if (!storeRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        try {
            storeService.deleteStoreAndAllData(id);
            return ResponseEntity.ok().body("Store and all data deleted successfully");
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Failed to delete store: " + e.getMessage());
        }
    }
}
