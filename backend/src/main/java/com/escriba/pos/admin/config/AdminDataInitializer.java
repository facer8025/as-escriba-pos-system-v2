package com.escriba.pos.admin.config;

import com.escriba.pos.admin.model.entity.AdminRole;
import com.escriba.pos.admin.model.entity.AdminUser;
import com.escriba.pos.admin.repository.AdminRoleRepository;
import com.escriba.pos.admin.repository.AdminUserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class AdminDataInitializer implements CommandLineRunner {

    private final AdminUserRepository adminUserRepository;
    private final AdminRoleRepository adminRoleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (!adminUserRepository.existsByEmail("superadmin@escriba.co")) {
            AdminRole saRole = adminRoleRepository.findByCode("SA")
                    .orElseThrow(() -> new RuntimeException("Admin role SA not found"));

            AdminUser superAdmin = AdminUser.builder()
                    .email("superadmin@escriba.co")
                    .firstName("Super")
                    .lastName("Admin")
                    .role(saRole)
                    .passwordHash(passwordEncoder.encode("AdminEscriba2025!"))
                    .totpEnabled(false)
                    .status("ACTIVE")
                    .build();

            adminUserRepository.save(superAdmin);
            log.info("✅ Super Admin created: superadmin@escriba.co / AdminEscriba2025!");
        } else {
            log.info("✅ Super Admin already exists");
        }
    }
}
