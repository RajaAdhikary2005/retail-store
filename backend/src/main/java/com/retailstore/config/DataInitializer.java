package com.retailstore.config;

import com.retailstore.model.User;
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
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.findByEmail("admin@retailstore.com").isEmpty()) {
            User admin = new User();
            admin.setName("Raja Adhikary");
            admin.setEmail("admin@retailstore.com");
            admin.setPassword(passwordEncoder.encode("password123"));
            admin.setRole("admin");
            admin.setStatus("approved");
            admin.setAvatar("RA");
            admin.setStoreId(1L);
            userRepository.save(admin);
            System.out.println("Default admin account created: admin@retailstore.com / password123");
        }
    }
}
