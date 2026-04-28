package com.retailstore.controller;

import com.retailstore.model.Supplier;
import com.retailstore.repository.SupplierRepository;
import com.retailstore.security.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/suppliers")
public class SupplierController {

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private SecurityUtils securityUtils;

    @GetMapping
    public List<Supplier> getAllSuppliers() {
        Long storeId = securityUtils.currentStoreId();
        return supplierRepository.findByStoreId(storeId);
    }

    @PostMapping
    public ResponseEntity<?> createSupplier(@RequestBody Supplier supplier) {
        try {
            Long storeId = securityUtils.currentStoreId();
            if (supplier.getStatus() == null) supplier.setStatus("Active");
            if (supplier.getTotalOrdersValue() == null) supplier.setTotalOrdersValue(0.0);
            if (supplier.getPendingDeliveries() == null) supplier.setPendingDeliveries(0);
            supplier.setStoreId(storeId);
            Supplier saved = supplierRepository.save(supplier);
            return new ResponseEntity<>(saved, HttpStatus.CREATED);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to create supplier: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateSupplier(@PathVariable Long id, @RequestBody Supplier updates) {
        try {
            Long storeId = securityUtils.currentStoreId();
            Supplier supplier = supplierRepository.findById(id).orElseThrow(() -> new RuntimeException("Supplier not found"));
            if (supplier.getStoreId() == null || !storeId.equals(supplier.getStoreId())) {
                throw new RuntimeException("Supplier not found");
            }

            if (updates.getName() != null) supplier.setName(updates.getName());
            if (updates.getContactPerson() != null) supplier.setContactPerson(updates.getContactPerson());
            if (updates.getEmail() != null) supplier.setEmail(updates.getEmail());
            if (updates.getPhone() != null) supplier.setPhone(updates.getPhone());
            if (updates.getCategory() != null) supplier.setCategory(updates.getCategory());
            if (updates.getStatus() != null) supplier.setStatus(updates.getStatus());
            if (updates.getTotalOrdersValue() != null) supplier.setTotalOrdersValue(updates.getTotalOrdersValue());
            if (updates.getPendingDeliveries() != null) supplier.setPendingDeliveries(updates.getPendingDeliveries());

            return ResponseEntity.ok(supplierRepository.save(supplier));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to update supplier: " + e.getMessage());
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSupplier(@PathVariable Long id) {
        try {
            Long storeId = securityUtils.currentStoreId();
            Supplier supplier = supplierRepository.findById(id).orElseThrow(() -> new RuntimeException("Supplier not found"));
            if (supplier.getStoreId() == null || !storeId.equals(supplier.getStoreId())) {
                throw new RuntimeException("Supplier not found");
            }
            supplierRepository.delete(supplier);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to delete supplier: " + e.getMessage());
        }
    }
}
