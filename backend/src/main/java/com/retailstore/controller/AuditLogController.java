package com.retailstore.controller;

import com.retailstore.model.AuditLog;
import com.retailstore.repository.AuditLogRepository;
import com.retailstore.security.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/audit-logs")
public class AuditLogController {

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private SecurityUtils securityUtils;

    @GetMapping
    public List<AuditLog> getAllLogs() {
        Long storeId = securityUtils.currentStoreId();
        return auditLogRepository.findByStoreId(storeId);
    }

    @PostMapping
    public AuditLog createLog(@RequestBody AuditLog log) {
        Long storeId = securityUtils.currentStoreId();
        log.setStoreId(storeId);
        return auditLogRepository.save(log);
    }
}
