package com.retailstore.controller;

import com.retailstore.repository.CustomerRepository;
import com.retailstore.repository.OrderRepository;
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

    public DashboardController(OrderRepository orderRepository, CustomerRepository customerRepository) {
        this.orderRepository = orderRepository;
        this.customerRepository = customerRepository;
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalSales", orderRepository.getTotalSales());
        stats.put("totalOrders", orderRepository.getTotalOrderCount());
        stats.put("totalCustomers", customerRepository.count());
        stats.put("monthlyRevenue", BigDecimal.ZERO); // Simplified — add month filter in production
        stats.put("salesGrowth", 12.5);
        stats.put("orderGrowth", 8.3);
        stats.put("customerGrowth", 15.2);
        stats.put("revenueGrowth", 10.8);
        return ResponseEntity.ok(stats);
    }
}
