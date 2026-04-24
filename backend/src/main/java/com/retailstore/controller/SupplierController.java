package com.retailstore.controller;

import com.retailstore.model.Supplier;
import com.retailstore.repository.SupplierRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/suppliers")
public class SupplierController {

    @Autowired
    private SupplierRepository supplierRepository;

    @GetMapping
    public List<Supplier> getAllSuppliers() {
        return supplierRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<?> createSupplier(@RequestBody Map<String, Object> body) {
        try {
            Supplier supplier = new Supplier();
            supplier.setName((String) body.getOrDefault("name", ""));
            supplier.setContactPerson((String) body.getOrDefault("contactPerson", ""));
            supplier.setEmail((String) body.getOrDefault("email", ""));
            supplier.setPhone((String) body.getOrDefault("phone", ""));
            supplier.setCategory((String) body.getOrDefault("category", ""));
            supplier.setStatus((String) body.getOrDefault("status", "Active"));
            supplier.setProductCategories(new ArrayList<>());
            supplier.setTotalOrdersValue(0.0);
            supplier.setPendingDeliveries(0);

            Supplier saved = supplierRepository.save(supplier);
            return new ResponseEntity<>(saved, HttpStatus.CREATED);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to create supplier: " + e.getMessage());
        }
    }
    
    @DeleteMapping("/{id}")
    public void deleteSupplier(@PathVariable Long id) {
        supplierRepository.deleteById(id);
    }
}
