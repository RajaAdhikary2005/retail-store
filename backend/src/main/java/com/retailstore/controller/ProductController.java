package com.retailstore.controller;

import com.retailstore.dto.ProductDTO;
import com.retailstore.security.SecurityUtils;
import com.retailstore.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;
    private final SecurityUtils securityUtils;

    public ProductController(ProductService productService, SecurityUtils securityUtils) {
        this.productService = productService;
        this.securityUtils = securityUtils;
    }

    @GetMapping
    public ResponseEntity<List<ProductDTO>> getAllProducts() {
        Long storeId = securityUtils.currentStoreId();
        return ResponseEntity.ok(productService.getProductsByStoreId(storeId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductDTO> getProductById(@PathVariable Integer id) {
        Long storeId = securityUtils.currentStoreId();
        return ResponseEntity.ok(productService.getProductById(id, storeId));
    }

    @PostMapping
    public ResponseEntity<ProductDTO> createProduct(@Valid @RequestBody ProductDTO dto) {
        Long storeId = securityUtils.currentStoreId();
        return new ResponseEntity<>(productService.createProduct(dto, storeId), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductDTO> updateProduct(@PathVariable Integer id, @RequestBody ProductDTO dto) {
        Long storeId = securityUtils.currentStoreId();
        return ResponseEntity.ok(productService.updateProduct(id, dto, storeId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Integer id) {
        Long storeId = securityUtils.currentStoreId();
        productService.deleteProduct(id, storeId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/stock")
    public ResponseEntity<ProductDTO> updateStock(
            @PathVariable Integer id,
            @RequestBody java.util.Map<String, Object> body) {
        Long storeId = securityUtils.currentStoreId();
        int additionalStock = ((Number) body.get("additionalStock")).intValue();
        return ResponseEntity.ok(productService.addStock(id, additionalStock, storeId));
    }
}
