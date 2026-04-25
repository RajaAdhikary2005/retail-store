package com.retailstore.controller;

import com.retailstore.model.AuditLog;
import com.retailstore.repository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/audit-logs")
public class AuditLogController {

    @Autowired
    private AuditLogRepository auditLogRepository;

    @GetMapping
    public List<AuditLog> getAllLogs(@RequestParam(required = false) Long storeId) {
        if (storeId != null) return auditLogRepository.findByStoreId(storeId);
        return auditLogRepository.findAll();
    }

    @PostMapping
    public AuditLog createLog(@RequestBody AuditLog log, @RequestParam(required = false) Long storeId) {
        if (storeId != null) log.setStoreId(storeId);
        return auditLogRepository.save(log);
    }
}
