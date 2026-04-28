package com.retailstore.controller;

import com.retailstore.model.Promotion;
import com.retailstore.repository.PromotionRepository;
import com.retailstore.security.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/promotions")
public class PromotionController {

    @Autowired
    private PromotionRepository promotionRepository;

    @Autowired
    private SecurityUtils securityUtils;

    @GetMapping
    public List<Promotion> getAllPromotions() {
        Long storeId = securityUtils.currentStoreId();
        return promotionRepository.findByStoreId(storeId);
    }

    @PostMapping
    public Promotion createPromotion(@RequestBody Promotion promotion) {
        Long storeId = securityUtils.currentStoreId();
        promotion.setStoreId(storeId);
        return promotionRepository.save(promotion);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePromotion(@PathVariable Long id) {
        Long storeId = securityUtils.currentStoreId();
        java.util.Optional<Promotion> promotion = promotionRepository.findById(id);
        if (promotion.isPresent() && storeId.equals(promotion.get().getStoreId())) {
            promotionRepository.delete(promotion.get());
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
