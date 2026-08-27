package com.escriba.pos.admin.service;

import com.escriba.pos.admin.exception.AdminBusinessException;
import com.escriba.pos.admin.model.dto.request.CreateAdminUserRequest;
import com.escriba.pos.admin.model.dto.request.UpdateAdminUserRequest;
import com.escriba.pos.admin.model.dto.response.AdminUserResponse;
import com.escriba.pos.admin.model.entity.AdminRole;
import com.escriba.pos.admin.model.entity.AdminUser;
import com.escriba.pos.admin.repository.AdminRoleRepository;
import com.escriba.pos.admin.repository.AdminUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final AdminUserRepository adminUserRepository;
    private final AdminRoleRepository adminRoleRepository;
    private final PasswordEncoder passwordEncoder;

        @Transactional(readOnly = true)
    public List<AdminUserResponse> listAdminUsers() {
        return adminUserRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

        @Transactional(readOnly = true)
    public AdminUserResponse getAdminUser(UUID id) {
        AdminUser user = adminUserRepository.findById(id)
                .orElseThrow(() -> new AdminBusinessException("Usuario admin no encontrado"));
        return toResponse(user);
    }

    @Transactional
    public AdminUserResponse createAdminUser(CreateAdminUserRequest request, AdminUser createdBy) {
        if (adminUserRepository.existsByEmail(request.getEmail())) {
            throw new AdminBusinessException("El email ya está registrado");
        }

        AdminRole role = adminRoleRepository.findByCode(request.getRole())
                .orElseThrow(() -> new AdminBusinessException("Rol no válido: " + request.getRole()));

        String password = request.getPassword() != null ? request.getPassword() : generateRandomPassword();

        AdminUser user = AdminUser.builder()
                .email(request.getEmail())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .role(role)
                .passwordHash(passwordEncoder.encode(password))
                .phone(request.getPhone())
                .position(request.getPosition())
                .status("ACTIVE")
                .totpEnabled(false)
                .failedAttempts((short) 0)
                .createdBy(createdBy)
                .build();

        user = adminUserRepository.save(user);
        return toResponse(user);
    }

    @Transactional
    public AdminUserResponse updateAdminUser(UUID id, UpdateAdminUserRequest request) {
        AdminUser user = adminUserRepository.findById(id)
                .orElseThrow(() -> new AdminBusinessException("Usuario admin no encontrado"));

        if (request.getFirstName() != null) user.setFirstName(request.getFirstName());
        if (request.getLastName() != null) user.setLastName(request.getLastName());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getPosition() != null) user.setPosition(request.getPosition());
        if (request.getIpWhitelist() != null) user.setIpWhitelist(request.getIpWhitelist());
        if (request.getRole() != null) {
            AdminRole role = adminRoleRepository.findByCode(request.getRole())
                    .orElseThrow(() -> new AdminBusinessException("Rol no válido"));
            user.setRole(role);
        }

        user = adminUserRepository.save(user);
        return toResponse(user);
    }

    @Transactional
    public AdminUserResponse toggleBlockUser(UUID id) {
        AdminUser user = adminUserRepository.findById(id)
                .orElseThrow(() -> new AdminBusinessException("Usuario admin no encontrado"));

        if ("BLOCKED".equals(user.getStatus())) {
            user.setStatus("ACTIVE");
            user.setFailedAttempts((short) 0);
            user.setLockedUntil(null);
        } else {
            user.setStatus("BLOCKED");
            user.setLockedUntil(LocalDateTime.now().plusDays(365));
        }

        user = adminUserRepository.save(user);
        return toResponse(user);
    }

    private String generateRandomPassword() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 12) + "Aa1!";
    }

    private AdminUserResponse toResponse(AdminUser user) {
        return AdminUserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole().getCode())
                .roleName(user.getRole().getName())
                .phone(user.getPhone())
                .position(user.getPosition())
                .status(user.getStatus())
                .totpEnabled(user.getTotpEnabled() != null && user.getTotpEnabled())
                .lastLoginAt(user.getLastLoginAt())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
