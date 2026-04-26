package com.retailstore.service;

import com.retailstore.dto.ProductDTO;
import com.retailstore.model.Category;
import com.retailstore.model.Product;
import com.retailstore.repository.CategoryRepository;
import com.retailstore.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    public ProductService(ProductRepository productRepository, CategoryRepository categoryRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
    }

    public List<ProductDTO> getAllProducts() {
        return productRepository.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<ProductDTO> getProductsByStoreId(Long storeId) {
        return productRepository.findByStoreId(storeId).stream().map(this::toDTO).collect(Collectors.toList());
    }

    public ProductDTO getProductById(Integer id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
        return toDTO(product);
    }

    public ProductDTO createProduct(ProductDTO dto) {
        Category category;
        if (dto.getCategoryId() != null) {
            category = categoryRepository.findById(dto.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found"));
        } else if (dto.getCategoryName() != null) {
            category = categoryRepository.findByName(dto.getCategoryName())
                    .orElseGet(() -> {
                        Category newCat = new Category();
                        newCat.setName(dto.getCategoryName());
                        return categoryRepository.save(newCat);
                    });
        } else {
            throw new RuntimeException("Category ID or Category Name is required");
        }

        Product product = new Product();
        product.setName(dto.getName());
        product.setCategory(category);
        product.setPrice(dto.getPrice());
        product.setStockQuantity(dto.getStockQuantity());
        product.setDescription(dto.getDescription());
        product.setImageUrl(dto.getImageUrl());
        return toDTO(productRepository.save(product));
    }

    public ProductDTO createProduct(ProductDTO dto, Long storeId) {
        Category category;
        if (dto.getCategoryId() != null) {
            category = categoryRepository.findById(dto.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found"));
        } else if (dto.getCategoryName() != null) {
            category = categoryRepository.findByName(dto.getCategoryName())
                    .orElseGet(() -> {
                        Category newCat = new Category();
                        newCat.setName(dto.getCategoryName());
                        if (storeId != null) newCat.setStoreId(storeId);
                        return categoryRepository.save(newCat);
                    });
        } else {
            throw new RuntimeException("Category ID or Category Name is required");
        }

        Product product = new Product();
        product.setName(dto.getName());
        product.setCategory(category);
        product.setPrice(dto.getPrice());
        product.setStockQuantity(dto.getStockQuantity());
        product.setDescription(dto.getDescription());
        product.setImageUrl(dto.getImageUrl());
        if (storeId != null) product.setStoreId(storeId);
        return toDTO(productRepository.save(product));
    }

    public ProductDTO updateProduct(Integer id, ProductDTO dto) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
        if (dto.getName() != null) product.setName(dto.getName());
        if (dto.getCategoryId() != null) {
            Category category = categoryRepository.findById(dto.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found"));
            product.setCategory(category);
        } else if (dto.getCategoryName() != null) {
            Category category = categoryRepository.findByName(dto.getCategoryName())
                    .orElseGet(() -> {
                        Category newCat = new Category();
                        newCat.setName(dto.getCategoryName());
                        if (product.getStoreId() != null) newCat.setStoreId(product.getStoreId());
                        return categoryRepository.save(newCat);
                    });
            product.setCategory(category);
        }
        if (dto.getPrice() != null) product.setPrice(dto.getPrice());
        if (dto.getStockQuantity() != null) product.setStockQuantity(dto.getStockQuantity());
        if (dto.getDescription() != null) product.setDescription(dto.getDescription());
        return toDTO(productRepository.save(product));
    }

    public void deleteProduct(Integer id) {
        if (!productRepository.existsById(id)) {
            throw new RuntimeException("Product not found with id: " + id);
        }
        productRepository.deleteById(id);
    }

    public ProductDTO addStock(Integer id, int additionalStock) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
        product.setStockQuantity((product.getStockQuantity() != null ? product.getStockQuantity() : 0) + additionalStock);
        return toDTO(productRepository.save(product));
    }

    private ProductDTO toDTO(Product product) {
        ProductDTO dto = new ProductDTO();
        dto.setId(product.getId());
        dto.setName(product.getName());
        dto.setCategoryId(product.getCategory().getId());
        dto.setCategoryName(product.getCategory().getName());
        dto.setPrice(product.getPrice());
        dto.setStockQuantity(product.getStockQuantity());
        dto.setDescription(product.getDescription());
        dto.setImageUrl(product.getImageUrl());
        dto.setCreatedAt(product.getCreatedAt() != null ? product.getCreatedAt().toString() : null);
        dto.setUpdatedAt(product.getUpdatedAt() != null ? product.getUpdatedAt().toString() : null);
        return dto;
    }
}
