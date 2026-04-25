package com.retailstore.service;

import com.retailstore.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class StoreService {

    @Autowired private StoreRepository storeRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private CustomerRepository customerRepository;
    @Autowired private OrderRepository orderRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private SupplierRepository supplierRepository;
    @Autowired private DueRepository dueRepository;
    @Autowired private AuditLogRepository auditLogRepository;
    @Autowired private PromotionRepository promotionRepository;
    @Autowired private ReturnRequestRepository returnRequestRepository;
    @Autowired private PurchaseOrderRepository purchaseOrderRepository;

    /**
     * Deletes a store and ALL its associated data.
     * This is a cascading delete that removes every entity belonging to this store.
     * Other stores remain completely unaffected.
     */
    public void deleteStoreAndAllData(Long storeId) {
        // Delete in dependency order (children first)
        // OrderItems are cascade-deleted with Orders via CascadeType.ALL

        orderRepository.deleteByStoreId(storeId);
        purchaseOrderRepository.deleteByStoreId(storeId);
        returnRequestRepository.deleteByStoreId(storeId);
        dueRepository.deleteByStoreId(storeId);
        auditLogRepository.deleteByStoreId(storeId);
        promotionRepository.deleteByStoreId(storeId);
        productRepository.deleteByStoreId(storeId);
        categoryRepository.deleteByStoreId(storeId);
        supplierRepository.deleteByStoreId(storeId);
        customerRepository.deleteByStoreId(storeId);
        userRepository.deleteByStoreId(storeId);

        // Finally delete the store itself
        storeRepository.deleteById(storeId);
    }
}
