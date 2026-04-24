package com.retailstore.model;

import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "suppliers")
public class Supplier {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String contactPerson;
    private String email;
    private String phone;
    private String category;
    
    @ElementCollection
    private List<String> productCategories;
    
    private Double totalOrdersValue = 0.0;
    private Integer pendingDeliveries = 0;
    private String status = "Active";

    public Supplier() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getContactPerson() { return contactPerson; }
    public void setContactPerson(String contactPerson) { this.contactPerson = contactPerson; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public List<String> getProductCategories() { return productCategories; }
    public void setProductCategories(List<String> productCategories) { this.productCategories = productCategories; }
    public Double getTotalOrdersValue() { return totalOrdersValue; }
    public void setTotalOrdersValue(Double totalOrdersValue) { this.totalOrdersValue = totalOrdersValue; }
    public Integer getPendingDeliveries() { return pendingDeliveries; }
    public void setPendingDeliveries(Integer pendingDeliveries) { this.pendingDeliveries = pendingDeliveries; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
