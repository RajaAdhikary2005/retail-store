package com.retailstore.service;

import com.retailstore.dto.OrderDTO;
import com.retailstore.model.Order;
import com.retailstore.model.OrderItem;
import com.retailstore.model.Customer;
import com.retailstore.model.Product;
import com.retailstore.repository.OrderRepository;
import com.retailstore.repository.CustomerRepository;
import com.retailstore.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.ArrayList;
import java.util.stream.Collectors;

@Service
@Transactional
public class OrderService {

    private final OrderRepository orderRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;

    public OrderService(OrderRepository orderRepository, CustomerRepository customerRepository, ProductRepository productRepository) {
        this.orderRepository = orderRepository;
        this.customerRepository = customerRepository;
        this.productRepository = productRepository;
    }

    public List<OrderDTO> getAllOrders() {
        return orderRepository.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    public OrderDTO getOrderById(Integer id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + id));
        return toDTO(order);
    }

    public OrderDTO createOrder(OrderDTO dto) {
        Customer customer = customerRepository.findById(dto.getCustomerId())
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        Order order = new Order();
        order.setCustomer(customer);
        order.setTotalAmount(dto.getTotalAmount());
        order.setStatus(dto.getStatus() != null ? dto.getStatus() : "Pending");
        order.setShippingAddress(dto.getShippingAddress());

        List<OrderItem> items = new ArrayList<>();
        if (dto.getItems() != null) {
            for (OrderDTO.OrderItemDTO itemDto : dto.getItems()) {
                Product product = productRepository.findById(itemDto.getProductId())
                        .orElseThrow(() -> new RuntimeException("Product not found: " + itemDto.getProductId()));
                
                OrderItem item = new OrderItem();
                item.setOrder(order);
                item.setProduct(product);
                item.setQuantity(itemDto.getQuantity());
                item.setUnitPrice(itemDto.getUnitPrice());
                item.setTotalPrice(itemDto.getTotalPrice());
                items.add(item);

                // Update stock
                product.setStockQuantity(product.getStockQuantity() - itemDto.getQuantity());
                productRepository.save(product);
            }
        }
        order.setItems(items);
        return toDTO(orderRepository.save(order));
    }

    public OrderDTO updateOrderStatus(Integer id, String status) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + id));
        order.setStatus(status);
        return toDTO(orderRepository.save(order));
    }

    private OrderDTO toDTO(Order order) {
        OrderDTO dto = new OrderDTO();
        dto.setId(order.getId());
        dto.setCustomerId(order.getCustomer().getId());
        dto.setCustomerName(order.getCustomer().getName());
        dto.setOrderDate(order.getOrderDate().toString());
        dto.setStatus(order.getStatus());
        dto.setTotalAmount(order.getTotalAmount());
        dto.setShippingAddress(order.getShippingAddress());

        if (order.getItems() != null) {
            dto.setItems(order.getItems().stream().map(this::toItemDTO).collect(Collectors.toList()));
        }
        return dto;
    }

    private OrderDTO.OrderItemDTO toItemDTO(OrderItem item) {
        OrderDTO.OrderItemDTO dto = new OrderDTO.OrderItemDTO();
        dto.setId(item.getId());
        dto.setProductId(item.getProduct().getId());
        dto.setProductName(item.getProduct().getName());
        dto.setQuantity(item.getQuantity());
        dto.setUnitPrice(item.getUnitPrice());
        dto.setTotalPrice(item.getTotalPrice());
        return dto;
    }
}
