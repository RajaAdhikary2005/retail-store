package com.retailstore.controller;

import com.retailstore.model.Supplier;
import com.retailstore.repository.SupplierRepository;
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

    @GetMapping
    public List<Supplier> getAllSuppliers(@RequestParam(required = false) Long storeId) {
        if (storeId != null) return supplierRepository.findByStoreId(storeId);
        return supplierRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<?> createSupplier(@RequestBody Supplier supplier, @RequestParam(required = false) Long storeId) {
        try {
            if (supplier.getStatus() == null) supplier.setStatus("Active");
            if (supplier.getTotalOrdersValue() == null) supplier.setTotalOrdersValue(0.0);
            if (supplier.getPendingDeliveries() == null) supplier.setPendingDeliveries(0);
            if (storeId != null) supplier.setStoreId(storeId);
            Supplier saved = supplierRepository.save(supplier);
            return new ResponseEntity<>(saved, HttpStatus.CREATED);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to create supplier: " + e.getMessage());
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSupplier(@PathVariable Long id) {
        try {
            supplierRepository.deleteById(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to delete supplier: " + e.getMessage());
        }
    }
}
