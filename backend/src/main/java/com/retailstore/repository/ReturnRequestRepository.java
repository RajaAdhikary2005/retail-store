package com.retailstore.repository;

import com.retailstore.model.ReturnRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReturnRequestRepository extends JpaRepository<ReturnRequest, Long> {
    List<ReturnRequest> findByStoreId(Long storeId);
    void deleteByStoreId(Long storeId);
}
