package com.retailstore.controller;

import com.retailstore.model.ReturnRequest;
import com.retailstore.repository.ReturnRequestRepository;
import com.retailstore.security.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/returns")
public class ReturnController {

    @Autowired
    private ReturnRequestRepository returnRepository;

    @Autowired
    private SecurityUtils securityUtils;

    @GetMapping
    public List<ReturnRequest> getAllReturns() {
        Long storeId = securityUtils.currentStoreId();
        return returnRepository.findByStoreId(storeId);
    }

    @PostMapping
    public ReturnRequest createReturn(@RequestBody ReturnRequest returnReq) {
        Long storeId = securityUtils.currentStoreId();
        returnReq.setStoreId(storeId);
        return returnRepository.save(returnReq);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Long storeId = securityUtils.currentStoreId();
        return returnRepository.findById(id).map(r -> {
            if (r.getStoreId() == null || !storeId.equals(r.getStoreId())) {
                return ResponseEntity.notFound().build();
            }
            r.setStatus(body.get("status"));
            return ResponseEntity.ok(returnRepository.save(r));
        }).orElse(ResponseEntity.notFound().build());
    }
}
