package com.retailstore.repository;

import com.retailstore.model.Due;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DueRepository extends JpaRepository<Due, Long> {
    List<Due> findByType(String type);
    List<Due> findByStoreId(Long storeId);
    void deleteByStoreId(Long storeId);
}
