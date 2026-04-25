package com.retailstore.repository;

import com.retailstore.model.Promotion;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PromotionRepository extends JpaRepository<Promotion, Long> {
    List<Promotion> findByStoreId(Long storeId);
    void deleteByStoreId(Long storeId);
}
