package com.retailstore.controller;

import com.retailstore.repository.CustomerRepository;
import com.retailstore.repository.OrderRepository;
import com.retailstore.repository.ProductRepository;
import com.retailstore.security.SecurityUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
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
    private final SecurityUtils securityUtils;

    public DashboardController(
            OrderRepository orderRepository,
            CustomerRepository customerRepository,
            ProductRepository productRepository,
            SecurityUtils securityUtils
    ) {
        this.orderRepository = orderRepository;
        this.customerRepository = customerRepository;
        this.productRepository = productRepository;
        this.securityUtils = securityUtils;
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        Long storeId = securityUtils.currentStoreId();
        Map<String, Object> stats = new HashMap<>();
        BigDecimal storeSales = orderRepository.getTotalSalesByStoreId(storeId);
        stats.put("totalSales", storeSales != null ? storeSales : BigDecimal.ZERO);
        stats.put("totalOrders", orderRepository.countByStoreId(storeId));
        stats.put("totalCustomers", customerRepository.countByStoreId(storeId));
        stats.put("totalProducts", productRepository.countByStoreId(storeId));
        stats.put("monthlyRevenue", BigDecimal.ZERO);
        stats.put("salesGrowth", 0);
        stats.put("orderGrowth", 0);
        stats.put("customerGrowth", 0);
        stats.put("revenueGrowth", 0);
        return ResponseEntity.ok(stats);
    }
}
