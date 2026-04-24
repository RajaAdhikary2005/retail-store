package com.retailstore.controller;

import com.retailstore.model.*;
import com.retailstore.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ManagementController {

    @Autowired
    private DueRepository dueRepository;

    @Autowired
    private PromotionRepository promotionRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private ReturnRequestRepository returnRepository;

    @GetMapping("/dues")
    public List<Due> getAllDues(@RequestParam(required = false) String type) {
        if (type != null) return dueRepository.findByType(type);
        return dueRepository.findAll();
    }

    @PostMapping("/dues")
    public Due createDue(@RequestBody Due due) {
        return dueRepository.save(due);
    }

    @GetMapping("/promotions")
    public List<Promotion> getAllPromotions() {
        return promotionRepository.findAll();
    }

    @PostMapping("/promotions")
    public Promotion createPromotion(@RequestBody Promotion promotion) {
        return promotionRepository.save(promotion);
    }

    @GetMapping("/audit-logs")
    public List<AuditLog> getAllLogs() {
        return auditLogRepository.findAll();
    }

    @PostMapping("/audit-logs")
    public AuditLog createLog(@RequestBody AuditLog log) {
        return auditLogRepository.save(log);
    }

    @GetMapping("/returns")
    public List<ReturnRequest> getAllReturns() {
        return returnRepository.findAll();
    }

    @PostMapping("/returns")
    public ReturnRequest createReturn(@RequestBody ReturnRequest returnReq) {
        return returnRepository.save(returnReq);
    }
}
