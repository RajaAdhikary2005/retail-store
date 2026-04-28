package com.retailstore.controller;

import com.retailstore.dto.OrderDTO;
import com.retailstore.security.SecurityUtils;
import com.retailstore.service.OrderService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;
    private final SecurityUtils securityUtils;

    public OrderController(OrderService orderService, SecurityUtils securityUtils) {
        this.orderService = orderService;
        this.securityUtils = securityUtils;
    }

    @GetMapping
    public ResponseEntity<List<OrderDTO>> getAllOrders() {
        Long storeId = securityUtils.currentStoreId();
        return ResponseEntity.ok(orderService.getOrdersByStoreId(storeId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderDTO> getOrderById(@PathVariable Integer id) {
        Long storeId = securityUtils.currentStoreId();
        return ResponseEntity.ok(orderService.getOrderById(id, storeId));
    }

    @PostMapping
    public ResponseEntity<OrderDTO> createOrder(@RequestBody OrderDTO dto) {
        Long storeId = securityUtils.currentStoreId();
        return new ResponseEntity<>(orderService.createOrder(dto, storeId), HttpStatus.CREATED);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<OrderDTO> updateOrderStatus(
            @PathVariable Integer id,
            @RequestBody Map<String, String> body) {
        Long storeId = securityUtils.currentStoreId();
        return ResponseEntity.ok(orderService.updateOrderStatus(id, body.get("status"), storeId));
    }
}
