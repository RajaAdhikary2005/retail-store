package com.retailstore.controller;

import com.retailstore.model.Store;
import com.retailstore.repository.StoreRepository;
import com.retailstore.service.StoreService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stores")
@CrossOrigin(origins = "*")
public class StoreController {

    @Autowired
    private StoreRepository storeRepository;

    @Autowired
    private StoreService storeService;

    @GetMapping
    public ResponseEntity<List<Store>> getAllStores() {
        return ResponseEntity.ok(storeRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<Store> createStore(@RequestBody Store store) {
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
