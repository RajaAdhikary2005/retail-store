package com.retailstore.controller;

import com.retailstore.model.Due;
import com.retailstore.repository.DueRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

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
}
