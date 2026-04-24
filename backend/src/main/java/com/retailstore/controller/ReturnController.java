package com.retailstore.controller;

import com.retailstore.model.ReturnRequest;
import com.retailstore.repository.ReturnRequestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/returns")
public class ReturnController {

    @Autowired
    private ReturnRequestRepository returnRepository;

    @GetMapping
    public List<ReturnRequest> getAllReturns() {
        return returnRepository.findAll();
    }

    @PostMapping
    public ReturnRequest createReturn(@RequestBody ReturnRequest returnReq) {
        return returnRepository.save(returnReq);
    }
}
