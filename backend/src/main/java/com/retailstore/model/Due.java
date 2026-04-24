package com.retailstore.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "dues")
public class Due {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String type; // CUSTOMER or SUPPLIER
    private Long entityId; // customerId or supplierId
    private String entityName;
    private String contact;
    private Double totalDue;
    private Integer pendingOrders = 0;
    private String status; // Overdue, Due Soon
    private LocalDateTime lastOrderDate;
    
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
