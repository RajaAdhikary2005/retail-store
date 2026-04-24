package com.retailstore.repository;

import com.retailstore.model.ReturnRequest;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReturnRequestRepository extends JpaRepository<ReturnRequest, Long> {
}
