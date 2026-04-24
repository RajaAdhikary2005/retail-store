package com.retailstore.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "purchase_orders")
public class PurchaseOrder {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long supplierId;
    private String supplierName;
    private String productNames; // comma separated for simplicity or use a relation
    private Double totalAmount;
    private String status; // Pending, Received, Cancelled
    private LocalDateTime orderDate;
    private LocalDateTime deliveryDate;

    @PrePersist
    protected void onCreate() {
        orderDate = LocalDateTime.now();
    }
}
