package com.retailstore.controller;

import com.retailstore.model.Customer;
import com.retailstore.dto.CustomerDTO;
import com.retailstore.repository.CustomerRepository;
import com.retailstore.security.SecurityUtils;
import com.retailstore.service.CustomerService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    private final CustomerService customerService;
    private final CustomerRepository customerRepository;
    private final SecurityUtils securityUtils;

    public CustomerController(
            CustomerService customerService,
            CustomerRepository customerRepository,
            SecurityUtils securityUtils
    ) {
        this.customerService = customerService;
        this.customerRepository = customerRepository;
        this.securityUtils = securityUtils;
    }

    @GetMapping
    public ResponseEntity<List<CustomerDTO>> getAllCustomers() {
        Long storeId = securityUtils.currentStoreId();
        return ResponseEntity.ok(customerService.getCustomersByStoreId(storeId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CustomerDTO> getCustomerById(@PathVariable Integer id) {
        Long storeId = securityUtils.currentStoreId();
        Customer customer = customerRepository.findById(id).orElseThrow(() -> new RuntimeException("Customer not found"));
        if (customer.getStoreId() == null || !storeId.equals(customer.getStoreId())) {
            throw new RuntimeException("Customer not found");
        }
        return ResponseEntity.ok(customerService.getCustomerById(id));
    }

    @PostMapping
    public ResponseEntity<?> createCustomer(@RequestBody Map<String, String> body) {
        try {
            Long storeId = securityUtils.currentStoreId();
            String name = body.getOrDefault("name", "").trim();
            String email = body.getOrDefault("email", "").trim();
            String phone = body.getOrDefault("phone", "").trim();

            if (name.isEmpty()) {
                return ResponseEntity.badRequest().body("Customer name is required");
            }
            if (email.isEmpty()) {
                return ResponseEntity.badRequest().body("Customer email is required");
            }

            // Check if email already exists
            if (customerRepository.findByEmail(email).isPresent()) {
                return ResponseEntity.badRequest().body("Customer email already exists. Please edit the existing customer instead.");
            }

            Customer customer = new Customer();
            customer.setName(name);
            customer.setEmail(email);
            customer.setPhone(phone.isEmpty() ? null : phone);
            customer.setAddress(body.getOrDefault("address", null));
            customer.setCity(body.getOrDefault("city", null));
            customer.setState(body.getOrDefault("state", null));
            customer.setZipCode(body.getOrDefault("zipCode", null));
            customer.setStoreId(storeId);

            Customer saved = customerRepository.save(customer);
            return new ResponseEntity<>(saved, HttpStatus.CREATED);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to create customer: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCustomer(@PathVariable Integer id, @RequestBody Map<String, String> body) {
        try {
            Long storeId = securityUtils.currentStoreId();
            Customer customer = customerRepository.findById(id).orElseThrow(() -> new RuntimeException("Customer not found"));
            if (customer.getStoreId() == null || !storeId.equals(customer.getStoreId())) {
                throw new RuntimeException("Customer not found");
            }
            String name = body.getOrDefault("name", null);
            String email = body.getOrDefault("email", null);
            String phone = body.getOrDefault("phone", null);
            
            if (name != null) customer.setName(name);
            if (email != null) {
                if (!email.equals(customer.getEmail()) && customerRepository.findByEmail(email).isPresent()) {
                    return ResponseEntity.badRequest().body("Customer email already exists.");
                }
                customer.setEmail(email);
            }
            if (phone != null) customer.setPhone(phone.isEmpty() ? null : phone);
            
            if (body.containsKey("address")) customer.setAddress(body.get("address"));
            if (body.containsKey("city")) customer.setCity(body.get("city"));
            if (body.containsKey("state")) customer.setState(body.get("state"));
            if (body.containsKey("zipCode")) customer.setZipCode(body.get("zipCode"));

            Customer saved = customerRepository.save(customer);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to update customer: " + e.getMessage());
        }
    }
}
