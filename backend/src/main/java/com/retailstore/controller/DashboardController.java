package com.retailstore.controller;

import com.retailstore.repository.CustomerRepository;
import com.retailstore.repository.OrderRepository;
import com.retailstore.repository.ProductRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final OrderRepository orderRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;

    public DashboardController(OrderRepository orderRepository, CustomerRepository customerRepository, ProductRepository productRepository) {
        this.orderRepository = orderRepository;
        this.customerRepository = customerRepository;
        this.productRepository = productRepository;
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats(@RequestParam(required = false) Long storeId) {
        Map<String, Object> stats = new HashMap<>();
        if (storeId != null) {
            // Scoped to a specific store
            BigDecimal storeSales = orderRepository.getTotalSalesByStoreId(storeId);
            stats.put("totalSales", storeSales != null ? storeSales : BigDecimal.ZERO);
            stats.put("totalOrders", orderRepository.countByStoreId(storeId));
            stats.put("totalCustomers", customerRepository.countByStoreId(storeId));
            stats.put("totalProducts", productRepository.countByStoreId(storeId));
        } else {
            stats.put("totalSales", orderRepository.getTotalSales());
            stats.put("totalOrders", orderRepository.getTotalOrderCount());
            stats.put("totalCustomers", customerRepository.count());
            stats.put("totalProducts", productRepository.count());
        }
        stats.put("monthlyRevenue", BigDecimal.ZERO);
        stats.put("salesGrowth", 0);
        stats.put("orderGrowth", 0);
        stats.put("customerGrowth", 0);
        stats.put("revenueGrowth", 0);
        return ResponseEntity.ok(stats);
    }
}
