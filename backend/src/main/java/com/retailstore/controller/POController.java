package com.retailstore.controller;

import com.retailstore.model.PurchaseOrder;
import com.retailstore.repository.PurchaseOrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/purchase-orders")
public class POController {

    @Autowired
    private PurchaseOrderRepository poRepository;

    @GetMapping
    public List<PurchaseOrder> getAllPOs() {
        return poRepository.findAll();
    }

    @PostMapping
    public PurchaseOrder createPO(@RequestBody PurchaseOrder po) {
        return poRepository.save(po);
    }
}
