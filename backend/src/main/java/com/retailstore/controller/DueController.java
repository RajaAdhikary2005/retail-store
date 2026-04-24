package com.retailstore.controller;

import com.retailstore.model.Due;
import com.retailstore.repository.DueRepository;
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

    @GetMapping
    public List<Due> getAllDues(@RequestParam(required = false) String type) {
        if (type != null) return dueRepository.findByType(type);
        return dueRepository.findAll();
    }

    @PostMapping
    public Due createDue(@RequestBody Due due) {
        return dueRepository.save(due);
    }

    @PutMapping("/{id}/pay")
    public ResponseEntity<?> payDue(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Optional<Due> dueOpt = dueRepository.findById(id);
        if (dueOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Due due = dueOpt.get();
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
