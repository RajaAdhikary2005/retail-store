package com.retailstore.controller;

import com.retailstore.model.Store;
import com.retailstore.repository.StoreRepository;
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

    @GetMapping
    public ResponseEntity<List<Store>> getAllStores() {
        return ResponseEntity.ok(storeRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<Store> createStore(@RequestBody Store store) {
        Store saved = storeRepository.save(store);
        return ResponseEntity.ok(saved);
    }
}
