package com.retailstore.config;

import com.retailstore.model.Store;
import com.retailstore.model.User;
import com.retailstore.repository.StoreRepository;
import com.retailstore.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StoreRepository storeRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Seed default store if none exists
        if (storeRepository.count() == 0) {
            Store defaultStore = new Store();
            defaultStore.setName("RetailStore Main");
            defaultStore.setAdminEmail("admin@retailstore.com");
            storeRepository.save(defaultStore);
            System.out.println("Default store created: RetailStore Main");
        }

        // Seed default admin if none exists
        if (userRepository.findByEmail("admin@retailstore.com").isEmpty()) {
            Store defaultStore = storeRepository.findByAdminEmail("admin@retailstore.com")
                .stream().findFirst().orElse(null);

            User admin = new User();
            admin.setName("Raja Adhikary");
            admin.setEmail("admin@retailstore.com");
            admin.setPassword(passwordEncoder.encode("password123"));
            admin.setRole("admin");
            admin.setStatus("approved");
            admin.setAvatar("RA");
            admin.setStoreId(defaultStore != null ? defaultStore.getId() : 1L);
            userRepository.save(admin);
            System.out.println("Default admin account created: admin@retailstore.com / password123");
        }
    }
}
