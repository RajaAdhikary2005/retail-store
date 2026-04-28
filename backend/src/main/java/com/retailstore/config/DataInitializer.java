package com.retailstore.config;

import com.retailstore.model.Store;
import com.retailstore.model.User;
import com.retailstore.repository.StoreRepository;
import com.retailstore.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StoreRepository storeRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private DataSource dataSource;

    @Value("${app.bootstrap.admin.email:admin@retailstore.com}")
    private String bootstrapAdminEmail;

    @Value("${app.bootstrap.admin.name:Retail Admin}")
    private String bootstrapAdminName;

    @Value("${app.bootstrap.admin.password:ChangeMe123!}")
    private String bootstrapAdminPassword;

    @Override
    public void run(String... args) throws Exception {
        // Fix: Alter orders.status column from ENUM to VARCHAR so any status string is accepted
        try (Connection conn = dataSource.getConnection(); Statement stmt = conn.createStatement()) {
            stmt.executeUpdate("ALTER TABLE orders MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'Pending'");
            System.out.println("orders.status column updated to VARCHAR(50)");
        } catch (Exception e) {
            System.out.println("orders.status column migration skipped: " + e.getMessage());
        }

        // Seed default store if none exists
        if (storeRepository.count() == 0) {
            Store defaultStore = new Store();
            defaultStore.setName("RetailStore Main");
            defaultStore.setAdminEmail(bootstrapAdminEmail);
            storeRepository.save(defaultStore);
            System.out.println("Default store created: RetailStore Main");
        }

        // Seed default admin if none exists
        if (userRepository.findByEmail(bootstrapAdminEmail).isEmpty()) {
            Store defaultStore = storeRepository.findByAdminEmail(bootstrapAdminEmail)
                .stream().findFirst().orElse(null);

            User admin = new User();
            admin.setName(bootstrapAdminName);
            admin.setEmail(bootstrapAdminEmail);
            admin.setPassword(passwordEncoder.encode(bootstrapAdminPassword));
            admin.setRole("admin");
            admin.setStatus("approved");
            admin.setAvatar(initialsFor(bootstrapAdminName));
            admin.setStoreId(defaultStore != null ? defaultStore.getId() : 1L);
            userRepository.save(admin);
            System.out.println("Bootstrap admin account created for: " + bootstrapAdminEmail);
        }
    }

    private String initialsFor(String name) {
        if (name == null || name.isBlank()) {
            return "AD";
        }
        String[] parts = name.trim().split("\\s+");
        if (parts.length >= 2) {
            return ("" + parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
        }
        return name.substring(0, Math.min(2, name.length())).toUpperCase();
    }
}
