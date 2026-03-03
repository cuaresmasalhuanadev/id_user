package com.biegsfritsstore.config;

import com.biegsfritsstore.model.Admin;
import com.biegsfritsstore.repository.AdminRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataInitializer {

    @Value("${admin.email}")
    private String adminEmail;

    @Value("${admin.whatsapp}")
    private String adminWhatsapp;

    @Value("${admin.referralCode}")
    private String adminReferralCode;

    @Autowired
    private AdminRepository adminRepository;

    @Bean
    public CommandLineRunner initAdmin() {
        return args -> {
            if (!adminRepository.existsByEmail(adminEmail)) {
                Admin admin = new Admin(adminEmail, adminWhatsapp, adminReferralCode);
                adminRepository.save(admin);
                System.out.println("[BiegsFritsStore] Admin inicializado: " + adminEmail);
            } else {
                System.out.println("[BiegsFritsStore] Admin ya existe en la BD.");
            }
        };
    }
}
