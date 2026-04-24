package com.retailstore.repository;

import com.retailstore.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Integer> {

    List<Order> findByCustomerId(Integer customerId);

    List<Order> findByStatus(Order.OrderStatus status);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.status != 'Cancelled'")
    BigDecimal getTotalSales();

    @Query("SELECT COUNT(o) FROM Order o")
    Long getTotalOrderCount();

    @Query(value = "SELECT DATE_FORMAT(o.order_date, '%Y-%m') AS month, " +
                   "SUM(o.total_amount) AS revenue " +
                   "FROM orders o WHERE o.status != 'Cancelled' " +
                   "GROUP BY DATE_FORMAT(o.order_date, '%Y-%m') " +
                   "ORDER BY month", nativeQuery = true)
    List<Object[]> getMonthlySales();
}
