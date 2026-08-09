package com.escriba.pos.admin.service;

import com.escriba.pos.admin.model.dto.request.CreateTenantRequest;
import com.escriba.pos.admin.model.dto.response.TenantResponse;
import com.escriba.pos.admin.model.entity.AdminUser;
import com.escriba.pos.admin.model.entity.Plan;
import com.escriba.pos.admin.model.entity.Tenant;
import com.escriba.pos.admin.repository.PlanRepository;
import com.escriba.pos.admin.repository.TenantRepository;
import com.escriba.pos.admin.security.AdminJwtTokenProvider;
import com.escriba.pos.admin.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TenantService {

    private final TenantRepository tenantRepository;
    private final PlanRepository planRepository;
    private final AdminJwtTokenProvider tokenProvider;
    private final EmailService emailService;

    public Page<TenantResponse> listTenants(String search, String status, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size);
        Page<Tenant> result;

        boolean hasSearch = search != null && !search.isBlank();
        boolean hasStatus = status != null && !status.isBlank();

        if (hasSearch && hasStatus) {
            result = tenantRepository.findByStatusAndSearch(status, search, pageRequest);
        } else if (hasSearch) {
            result = tenantRepository.findBySearch(search, pageRequest);
        } else if (hasStatus) {
            result = tenantRepository.findByStatusOrderByCreatedAtDesc(status, pageRequest);
        } else {
            result = tenantRepository.findAll(pageRequest);
        }

        return result.map(this::toResponse);
    }

    public TenantResponse getTenant(UUID id) {
        Tenant tenant = tenantRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));
        return toResponse(tenant);
    }

    @Transactional
    public TenantResponse createTenant(CreateTenantRequest request, AdminUser createdBy) {
        // Validar unicidad
        if (tenantRepository.existsByNit(request.getNit())) {
            throw new RuntimeException("El NIT ya está registrado");
        }
        if (tenantRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("El email ya está registrado");
        }

        Plan plan = planRepository.findById(request.getPlanId())
                .orElseThrow(() -> new RuntimeException("Plan no encontrado"));

        // Generar schema name desde NIT
        String schemaName = "tenant_" + request.getNit().replaceAll("[^a-zA-Z0-9]", "_").toLowerCase();

        Tenant tenant = Tenant.builder()
                .personType(request.getPersonType())
                .nit(request.getNit())
                .dv(request.getDv())
                .businessName(request.getBusinessName())
                .tradeName(request.getTradeName())
                .taxRegime(request.getTaxRegime())
                .ciiuCode(request.getCiiuCode())
                .address(request.getAddress())
                .department(request.getDepartment())
                .city(request.getCity())
                .phone(request.getPhone())
                .email(request.getEmail())
                .website(request.getWebsite())
                .status("TRIAL")
                .schemaName(schemaName)
                .timezone(request.getTimezone())
                .createdBy(createdBy)
                .notes(request.getNotes())
                .build();

        tenant = tenantRepository.save(tenant);

        // Enviar email de bienvenida al admin de la empresa
        String adminName = request.getAdminFirstName() + " " + request.getAdminLastName();
        String adminEmail = request.getAdminEmail() != null ? request.getAdminEmail() : request.getEmail();
        String tempPassword = request.getAdminPassword() != null ? request.getAdminPassword() : "Bienvenido2025!";
        emailService.sendWelcomeEmail(adminEmail, request.getBusinessName(), adminName, tempPassword);

        return toResponse(tenant);
    }

    @Transactional
    public TenantResponse updateTenantStatus(UUID id, String status, String reason) {
        Tenant tenant = tenantRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));
        tenant.setStatus(status);
        tenant.setSuspensionReason(reason);
        switch (status) {
            case "SUSPENDED" -> tenant.setSuspendedAt(LocalDateTime.now());
            case "CANCELLED" -> tenant.setCancelledAt(LocalDateTime.now());
            case "ACTIVE" -> tenant.setActivatedAt(LocalDateTime.now());
        }
        tenant = tenantRepository.save(tenant);
        return toResponse(tenant);
    }

    /**
     * Genera un token JWT de impersonation para acceder al panel de la empresa.
     * El token tiene duración de 2h, no es renovable, y queda registrado en auditoría.
     */
    public String generateImpersonationToken(UUID tenantId, AdminUser adminUser, String reason) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));
        // En producción, buscar un usuario administrador de la empresa para impersonar
        UUID tenantUserId = tenantId; // Placeholder: se reemplazaría con un usuario real del tenant
        return tokenProvider.generateImpersonationToken(
                tenantUserId, tenantId, adminUser.getId(), reason);
    }

    private TenantResponse toResponse(Tenant tenant) {
        return TenantResponse.builder()
                .id(tenant.getId())
                .nit(tenant.getNit())
                .dv(tenant.getDv())
                .businessName(tenant.getBusinessName())
                .tradeName(tenant.getTradeName())
                .taxRegime(tenant.getTaxRegime())
                .ciiuCode(tenant.getCiiuCode())
                .city(tenant.getCity())
                .department(tenant.getDepartment())
                .phone(tenant.getPhone())
                .email(tenant.getEmail())
                .logoUrl(tenant.getLogoUrl())
                .status(tenant.getStatus())
                .schemaName(tenant.getSchemaName())
                .timezone(tenant.getTimezone())
                .registeredAt(tenant.getRegisteredAt())
                .activatedAt(tenant.getActivatedAt())
                .suspendedAt(tenant.getSuspendedAt())
                .cancelledAt(tenant.getCancelledAt())
                .suspensionReason(tenant.getSuspensionReason())
                .build();
    }
}
