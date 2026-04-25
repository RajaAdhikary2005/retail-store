package com.retailstore.repository;

import com.retailstore.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByStoreId(Long storeId);
    void deleteByStoreId(Long storeId);
}
