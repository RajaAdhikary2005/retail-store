package com.retailstore.repository;

import com.retailstore.model.PurchaseOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long> {
    List<PurchaseOrder> findByStoreId(Long storeId);
    void deleteByStoreId(Long storeId);
}
