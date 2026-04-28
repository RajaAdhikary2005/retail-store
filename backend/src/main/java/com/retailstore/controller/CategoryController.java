package com.retailstore.controller;

import com.retailstore.model.Category;
import com.retailstore.repository.CategoryRepository;
import com.retailstore.security.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private SecurityUtils securityUtils;

    @GetMapping
    public List<Category> getAllCategories() {
        Long storeId = securityUtils.currentStoreId();
        return categoryRepository.findByStoreId(storeId);
    }
}
