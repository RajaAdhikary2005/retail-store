package com.retailstore.controller;

import com.retailstore.model.PurchaseOrder;
import com.retailstore.repository.PurchaseOrderRepository;
import com.retailstore.security.SecurityUtils;
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
    private SecurityUtils securityUtils;

    @GetMapping
    public List<PurchaseOrder> getAllPOs() {
        Long storeId = securityUtils.currentStoreId();
        return poRepository.findByStoreId(storeId);
    }

    @PostMapping
    public PurchaseOrder createPO(@RequestBody PurchaseOrder po) {
        Long storeId = securityUtils.currentStoreId();
        po.setStoreId(storeId);
        return poRepository.save(po);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<PurchaseOrder> updatePOStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        Long storeId = securityUtils.currentStoreId();
        return poRepository.findById(id).map(po -> {
            if (po.getStoreId() == null || !storeId.equals(po.getStoreId())) {
                return ResponseEntity.notFound().build();
            }
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
