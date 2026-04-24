package com.retailstore.service;

import com.retailstore.dto.CustomerDTO;
import com.retailstore.model.Customer;
import com.retailstore.model.Order;
import com.retailstore.repository.CustomerRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class CustomerService {

    private final CustomerRepository customerRepository;

    public CustomerService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    public List<CustomerDTO> getAllCustomers() {
        return customerRepository.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    public CustomerDTO getCustomerById(Integer id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found with id: " + id));
        return toDTO(customer);
    }

    private CustomerDTO toDTO(Customer customer) {
        CustomerDTO dto = new CustomerDTO();
        dto.setId(customer.getId());
        dto.setName(customer.getName());
        dto.setEmail(customer.getEmail());
        dto.setPhone(customer.getPhone());
        dto.setAddress(customer.getAddress());
        dto.setCity(customer.getCity());
        dto.setState(customer.getState());
        dto.setZipCode(customer.getZipCode());
        dto.setJoinDate(customer.getJoinDate() != null ? customer.getJoinDate().toString() : null);

        List<Order> orders = customer.getOrders();
        if (orders != null) {
            dto.setTotalOrders(orders.size());
            dto.setTotalSpent(orders.stream()
                    .filter(o -> o.getStatus() != Order.OrderStatus.Cancelled)
                    .map(Order::getTotalAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add));
        } else {
            dto.setTotalOrders(0);
            dto.setTotalSpent(BigDecimal.ZERO);
        }
        return dto;
    }
}
