package com.retailstore.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
public class HealthController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @GetMapping("/api/health")
    public ResponseEntity<Map<String, String>> health() {
        Map<String, String> response = new HashMap<>();
        try {
            // Run a very fast, read-only query to keep Aiven DB awake
            jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            response.put("status", "ok");
            response.put("service", "retail-store-api");
            response.put("database", "connected and awake");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "error");
            response.put("service", "retail-store-api");
            response.put("database", "disconnected: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
}
