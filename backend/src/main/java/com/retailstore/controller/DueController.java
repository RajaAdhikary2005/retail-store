package com.retailstore.controller;

import com.retailstore.model.Due;
import com.retailstore.repository.DueRepository;
import com.retailstore.security.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/dues")
public class DueController {

    @Autowired
    private DueRepository dueRepository;

    @Autowired
    private SecurityUtils securityUtils;

    @GetMapping
    public List<Due> getAllDues(@RequestParam(required = false) String type) {
        Long storeId = securityUtils.currentStoreId();
        if (type != null) return dueRepository.findByStoreIdAndType(storeId, type);
        return dueRepository.findByStoreId(storeId);
    }

    @PostMapping
    public Due createDue(@RequestBody Due due) {
        Long storeId = securityUtils.currentStoreId();
        due.setStoreId(storeId);
        return dueRepository.save(due);
    }

    @PutMapping("/{id}/pay")
    public ResponseEntity<?> payDue(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Long storeId = securityUtils.currentStoreId();
        Optional<Due> dueOpt = dueRepository.findById(id);
        if (dueOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Due due = dueOpt.get();
        if (due.getStoreId() == null || !storeId.equals(due.getStoreId())) {
            return ResponseEntity.notFound().build();
        }
        Number amountNum = (Number) body.get("amount");
        double paymentAmount = amountNum != null ? amountNum.doubleValue() : 0;

        if (paymentAmount <= 0) {
            return ResponseEntity.badRequest().body("Payment amount must be positive");
        }

        double remaining = due.getTotalDue() - paymentAmount;
        if (remaining <= 0) {
            due.setTotalDue(0.0);
            due.setStatus("Paid");
        } else {
            due.setTotalDue(remaining);
        }

        dueRepository.save(due);
        return ResponseEntity.ok(due);
    }
}
