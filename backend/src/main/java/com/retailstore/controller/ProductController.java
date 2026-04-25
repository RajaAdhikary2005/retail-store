package com.retailstore.controller;

import com.retailstore.dto.ProductDTO;
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

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public ResponseEntity<List<ProductDTO>> getAllProducts(@RequestParam(required = false) Long storeId) {
        if (storeId != null) {
            return ResponseEntity.ok(productService.getProductsByStoreId(storeId));
        }
        return ResponseEntity.ok(productService.getAllProducts());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductDTO> getProductById(@PathVariable Integer id) {
        return ResponseEntity.ok(productService.getProductById(id));
    }

    @PostMapping
    public ResponseEntity<ProductDTO> createProduct(@Valid @RequestBody ProductDTO dto, @RequestParam(required = false) Long storeId) {
        return new ResponseEntity<>(productService.createProduct(dto, storeId), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductDTO> updateProduct(@PathVariable Integer id, @RequestBody ProductDTO dto) {
        return ResponseEntity.ok(productService.updateProduct(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Integer id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/stock")
    public ResponseEntity<ProductDTO> updateStock(
            @PathVariable Integer id,
            @RequestBody java.util.Map<String, Object> body) {
        int additionalStock = ((Number) body.get("additionalStock")).intValue();
        return ResponseEntity.ok(productService.addStock(id, additionalStock));
    }
}
