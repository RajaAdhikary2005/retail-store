package com.retailstore.controller;

import com.retailstore.model.Supplier;
import com.retailstore.model.PurchaseOrder;
import com.retailstore.repository.SupplierRepository;
import com.retailstore.repository.PurchaseOrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class SupplierController {

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private PurchaseOrderRepository poRepository;

    @GetMapping("/suppliers")
    public List<Supplier> getAllSuppliers() {
        return supplierRepository.findAll();
    }

    @PostMapping("/suppliers")
    public Supplier createSupplier(@RequestBody Supplier supplier) {
        return supplierRepository.save(supplier);
    }

    @GetMapping("/purchase-orders")
    public List<PurchaseOrder> getAllPOs() {
        return poRepository.findAll();
    }

    @PostMapping("/purchase-orders")
    public PurchaseOrder createPO(@RequestBody PurchaseOrder po) {
        return poRepository.save(po);
    }
}
