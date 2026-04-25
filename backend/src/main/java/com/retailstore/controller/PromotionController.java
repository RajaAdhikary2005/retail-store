package com.retailstore.controller;

import com.retailstore.model.Promotion;
import com.retailstore.repository.PromotionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/promotions")
public class PromotionController {

    @Autowired
    private PromotionRepository promotionRepository;

    @GetMapping
    public List<Promotion> getAllPromotions(@RequestParam(required = false) Long storeId) {
        if (storeId != null) return promotionRepository.findByStoreId(storeId);
        return promotionRepository.findAll();
    }

    @PostMapping
    public Promotion createPromotion(@RequestBody Promotion promotion, @RequestParam(required = false) Long storeId) {
        if (storeId != null) promotion.setStoreId(storeId);
        return promotionRepository.save(promotion);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePromotion(@PathVariable Long id) {
        if (promotionRepository.existsById(id)) {
            promotionRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
