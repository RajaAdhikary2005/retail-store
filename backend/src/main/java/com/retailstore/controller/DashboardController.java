package com.retailstore.controller;

import com.retailstore.repository.CustomerRepository;
import com.retailstore.repository.OrderRepository;
import com.retailstore.repository.ProductRepository;
import com.retailstore.security.SecurityUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final OrderRepository orderRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final SecurityUtils securityUtils;

    public DashboardController(
            OrderRepository orderRepository,
            CustomerRepository customerRepository,
            ProductRepository productRepository,
            SecurityUtils securityUtils
    ) {
        this.orderRepository = orderRepository;
        this.customerRepository = customerRepository;
        this.productRepository = productRepository;
        this.securityUtils = securityUtils;
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        Long storeId = securityUtils.currentStoreId();
        Map<String, Object> stats = new HashMap<>();

        YearMonth currentMonth = YearMonth.now();
        YearMonth previousMonth = currentMonth.minusMonths(1);

        LocalDate currentMonthStart = currentMonth.atDay(1);
        LocalDate nextMonthStart = currentMonth.plusMonths(1).atDay(1);
        LocalDate previousMonthStart = previousMonth.atDay(1);
        LocalDate currentMonthStartForPreviousWindow = currentMonth.atDay(1);

        BigDecimal storeSales = orderRepository.getTotalSalesByStoreId(storeId);
        BigDecimal currentMonthSales = orderRepository.getSalesByStoreIdBetweenDates(storeId, currentMonthStart, nextMonthStart);
        BigDecimal previousMonthSales = orderRepository.getSalesByStoreIdBetweenDates(storeId, previousMonthStart, currentMonthStartForPreviousWindow);

        Long currentMonthOrders = orderRepository.countByStoreIdAndOrderDateGreaterThanEqualAndOrderDateLessThan(storeId, currentMonthStart, nextMonthStart);
        Long previousMonthOrders = orderRepository.countByStoreIdAndOrderDateGreaterThanEqualAndOrderDateLessThan(storeId, previousMonthStart, currentMonthStartForPreviousWindow);

        Long currentMonthCustomers = customerRepository.countByStoreIdAndJoinDateGreaterThanEqualAndJoinDateLessThan(storeId, currentMonthStart, nextMonthStart);
        Long previousMonthCustomers = customerRepository.countByStoreIdAndJoinDateGreaterThanEqualAndJoinDateLessThan(storeId, previousMonthStart, currentMonthStartForPreviousWindow);

        stats.put("totalSales", storeSales != null ? storeSales : BigDecimal.ZERO);
        stats.put("totalOrders", orderRepository.countByStoreId(storeId));
        stats.put("totalCustomers", customerRepository.countByStoreId(storeId));
        stats.put("totalProducts", productRepository.countByStoreId(storeId));
        stats.put("monthlyRevenue", safeBigDecimal(currentMonthSales));
        stats.put("salesGrowth", growthPercent(safeBigDecimal(currentMonthSales), safeBigDecimal(previousMonthSales)));
        stats.put("orderGrowth", growthPercent(asBigDecimal(currentMonthOrders), asBigDecimal(previousMonthOrders)));
        stats.put("customerGrowth", growthPercent(asBigDecimal(currentMonthCustomers), asBigDecimal(previousMonthCustomers)));
        stats.put("revenueGrowth", growthPercent(safeBigDecimal(currentMonthSales), safeBigDecimal(previousMonthSales)));
        return ResponseEntity.ok(stats);
    }

    private BigDecimal safeBigDecimal(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private BigDecimal asBigDecimal(Long value) {
        return BigDecimal.valueOf(value == null ? 0L : value);
    }

    private double growthPercent(BigDecimal current, BigDecimal previous) {
        if (previous.compareTo(BigDecimal.ZERO) == 0) {
            if (current.compareTo(BigDecimal.ZERO) == 0) {
                return 0.0;
            }
            return 100.0;
        }

        return current.subtract(previous)
                .multiply(BigDecimal.valueOf(100))
                .divide(previous, 1, RoundingMode.HALF_UP)
                .doubleValue();
    }
}
