package com.retailstore.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

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

    public Due() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public Long getEntityId() { return entityId; }
    public void setEntityId(Long entityId) { this.entityId = entityId; }
    public String getEntityName() { return entityName; }
    public void setEntityName(String entityName) { this.entityName = entityName; }
    public String getContact() { return contact; }
    public void setContact(String contact) { this.contact = contact; }
    public Double getTotalDue() { return totalDue; }
    public void setTotalDue(Double totalDue) { this.totalDue = totalDue; }
    public Integer getPendingOrders() { return pendingOrders; }
    public void setPendingOrders(Integer pendingOrders) { this.pendingOrders = pendingOrders; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getLastOrderDate() { return lastOrderDate; }
    public void setLastOrderDate(LocalDateTime lastOrderDate) { this.lastOrderDate = lastOrderDate; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
