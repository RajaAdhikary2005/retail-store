package com.retailstore.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "promotions")
public class Promotion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String type; // Discount, Buy1Get1, Seasonal
    private String description;
    private String code;
    private Double discountValue;
    private String status; // Active, Scheduled, Ended
    private LocalDateTime startDate;
    private LocalDateTime endDate;
}
