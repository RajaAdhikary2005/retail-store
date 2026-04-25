package com.retailstore.controller;

import com.retailstore.model.ReturnRequest;
import com.retailstore.repository.ReturnRequestRepository;
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

    @GetMapping
    public List<ReturnRequest> getAllReturns(@RequestParam(required = false) Long storeId) {
        if (storeId != null) return returnRepository.findByStoreId(storeId);
        return returnRepository.findAll();
    }

    @PostMapping
    public ReturnRequest createReturn(@RequestBody ReturnRequest returnReq, @RequestParam(required = false) Long storeId) {
        if (storeId != null) returnReq.setStoreId(storeId);
        return returnRepository.save(returnReq);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return returnRepository.findById(id).map(r -> {
            r.setStatus(body.get("status"));
            return ResponseEntity.ok(returnRepository.save(r));
        }).orElse(ResponseEntity.notFound().build());
    }
}
