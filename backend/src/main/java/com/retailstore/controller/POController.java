package com.retailstore.controller;

import com.retailstore.model.PurchaseOrder;
import com.retailstore.model.Product;
import com.retailstore.repository.PurchaseOrderRepository;
import com.retailstore.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/purchase-orders")
public class POController {

    @Autowired
    private PurchaseOrderRepository poRepository;

    @Autowired
    private ProductRepository productRepository;

    @GetMapping
    public List<PurchaseOrder> getAllPOs() {
        return poRepository.findAll();
    }

    @PostMapping
    public PurchaseOrder createPO(@RequestBody PurchaseOrder po) {
        return poRepository.save(po);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<PurchaseOrder> updatePOStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        return poRepository.findById(id).map(po -> {
            String newStatus = (String) body.get("status");
            Integer receivedQty = body.get("receivedQuantity") != null
                    ? ((Number) body.get("receivedQuantity")).intValue()
                    : null;

            po.setStatus(newStatus);
            if (receivedQty != null) {
                po.setReceivedQuantity(receivedQty);
            }
            if ("Received".equals(newStatus) || "Partially Received".equals(newStatus)) {
                po.setDeliveryDate(LocalDateTime.now());
            }
            PurchaseOrder saved = poRepository.save(po);
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }
}
