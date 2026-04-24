package com.retailstore.controller;

import com.retailstore.dto.CustomerDTO;
import com.retailstore.model.Customer;
import com.retailstore.repository.CustomerRepository;
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

    public CustomerController(CustomerService customerService, CustomerRepository customerRepository) {
        this.customerService = customerService;
        this.customerRepository = customerRepository;
    }

    @GetMapping
    public ResponseEntity<List<CustomerDTO>> getAllCustomers() {
        return ResponseEntity.ok(customerService.getAllCustomers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CustomerDTO> getCustomerById(@PathVariable Integer id) {
        return ResponseEntity.ok(customerService.getCustomerById(id));
    }

    @PostMapping
    public ResponseEntity<?> createCustomer(@RequestBody Map<String, String> body) {
        try {
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
                // Return existing customer instead of error
                Customer existing = customerRepository.findByEmail(email).get();
                return ResponseEntity.ok(existing);
            }

            Customer customer = new Customer();
            customer.setName(name);
            customer.setEmail(email);
            customer.setPhone(phone.isEmpty() ? null : phone);
            customer.setAddress(body.getOrDefault("address", null));
            customer.setCity(body.getOrDefault("city", null));
            customer.setState(body.getOrDefault("state", null));
            customer.setZipCode(body.getOrDefault("zipCode", null));

            Customer saved = customerRepository.save(customer);
            return new ResponseEntity<>(saved, HttpStatus.CREATED);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to create customer: " + e.getMessage());
        }
    }
}
