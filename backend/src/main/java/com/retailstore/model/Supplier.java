package com.retailstore.model;

import jakarta.persistence.*;
import lombok.Data;
import java.util.List;

@Data
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
}
