package com.retailstore.repository;

import com.retailstore.model.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Integer> {
    Optional<Customer> findByEmail(String email);
    List<Customer> findByNameContainingIgnoreCase(String name);
    List<Customer> findByStoreId(Long storeId);
    void deleteByStoreId(Long storeId);
    Long countByStoreId(Long storeId);
    Long countByStoreIdAndJoinDateGreaterThanEqualAndJoinDateLessThan(Long storeId, LocalDate startDate, LocalDate endDate);
}
