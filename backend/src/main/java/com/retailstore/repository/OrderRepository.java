package com.retailstore.repository;

import com.retailstore.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Integer> {

    List<Order> findByCustomerId(Integer customerId);

    List<Order> findByStoreId(Long storeId);

    void deleteByStoreId(Long storeId);

    // Fixed query to use native SQL for status comparison to avoid Enum issues in JPQL
    @Query(value = "SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status != 'Cancelled'", nativeQuery = true)
    BigDecimal getTotalSales();

    @Query(value = "SELECT COUNT(*) FROM orders", nativeQuery = true)
    Long getTotalOrderCount();

    @Query(value = "SELECT DATE_FORMAT(order_date, '%Y-%m') AS month, " +
                   "SUM(total_amount) AS revenue " +
                   "FROM orders WHERE status != 'Cancelled' " +
                   "GROUP BY DATE_FORMAT(order_date, '%Y-%m') " +
                   "ORDER BY month", nativeQuery = true)
    List<Object[]> getMonthlySales();

    @Query(value = "SELECT COUNT(*) FROM orders WHERE store_id = :storeId", nativeQuery = true)
    Long countByStoreId(Long storeId);

    @Query(value = "SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE store_id = :storeId AND status != 'Cancelled'", nativeQuery = true)
    BigDecimal getTotalSalesByStoreId(Long storeId);

    @Query(value = "SELECT COALESCE(SUM(total_amount), 0) FROM orders " +
            "WHERE store_id = :storeId " +
            "AND status != 'Cancelled' " +
            "AND order_date >= :startDate " +
            "AND order_date < :endDate", nativeQuery = true)
    BigDecimal getSalesByStoreIdBetweenDates(Long storeId, LocalDate startDate, LocalDate endDate);

    Long countByStoreIdAndOrderDateGreaterThanEqualAndOrderDateLessThan(Long storeId, LocalDate startDate, LocalDate endDate);
}
