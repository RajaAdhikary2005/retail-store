package com.retailstore.controller;

import com.retailstore.model.Category;
import com.retailstore.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    @Autowired
    private CategoryRepository categoryRepository;

    @GetMapping
    public List<Category> getAllCategories(@RequestParam(required = false) Long storeId) {
        if (storeId != null) return categoryRepository.findByStoreId(storeId);
        return categoryRepository.findAll();
    }
}
