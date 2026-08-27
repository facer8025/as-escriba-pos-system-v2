package com.escriba.pos.admin.service;

import com.escriba.pos.admin.exception.AdminBusinessException;
import com.escriba.pos.admin.model.dto.request.CreateTenantRequest;
import com.escriba.pos.admin.model.dto.response.TenantResponse;
import com.escriba.pos.admin.model.entity.AdminUser;
import com.escriba.pos.admin.model.entity.License;
import com.escriba.pos.admin.model.entity.Plan;
import com.escriba.pos.admin.model.entity.Tenant;
import com.escriba.pos.admin.repository.LicenseRepository;
import com.escriba.pos.admin.repository.PlanRepository;
import com.escriba.pos.admin.repository.TenantRepository;
import com.escriba.pos.admin.security.AdminJwtTokenProvider;
import com.escriba.pos.model.entity.Branch;
import com.escriba.pos.model.entity.Company;
import com.escriba.pos.model.entity.User;
import com.escriba.pos.repository.BranchRepository;
import com.escriba.pos.repository.CompanyRepository;
import com.escriba.pos.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TenantService {

    private static final String PASSWORD_CHARS =
            "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final TenantRepository tenantRepository;
    private final PlanRepository planRepository;
    private final LicenseRepository licenseRepository;
    private final CompanyRepository companyRepository;
    private final BranchRepository branchRepository;
    private final UserRepository userRepository;
    private final AdminJwtTokenProvider tokenProvider;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

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
                .orElseThrow(() -> new AdminBusinessException("Empresa no encontrada"));
        return toResponse(tenant);
    }

    @Transactional
    public TenantResponse createTenant(CreateTenantRequest request, AdminUser createdBy) {
        // Validar unicidad
        if (tenantRepository.existsByNit(request.getNit())) {
            throw new AdminBusinessException("El NIT ya está registrado");
        }
        if (tenantRepository.existsByEmail(request.getEmail())) {
            throw new AdminBusinessException("El email ya está registrado");
        }

        Plan plan = planRepository.findById(request.getPlanId())
                .orElseThrow(() -> new AdminBusinessException("Plan no encontrado"));

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

        // Crear la licencia asociada a la empresa (plan, tipo y duración del wizard)
        LocalDate startDate = request.getLicenseStartDate() != null
                ? request.getLicenseStartDate()
                : LocalDate.now();
        int durationMonths = request.getLicenseDuration() != null ? request.getLicenseDuration() : 1;
        License license = License.builder()
                .tenant(tenant)
                .plan(plan)
                .licenseType(request.getLicenseType())
                .status("ACTIVE")
                .startsAt(startDate.atStartOfDay())
                .expiresAt(startDate.plusMonths(durationMonths).atStartOfDay())
                .autoRenew(request.isAutoRenew())
                .gracePeriodDays(request.getGracePeriodDays())
                .pricePaidMonthly(plan.getPriceMonthly())
                .discountPct(request.getDiscountPct() != null ? request.getDiscountPct() : BigDecimal.ZERO)
                .discountReason(request.getDiscountReason())
                .notes(request.getNotes())
                .createdBy(createdBy)
                .build();
        licenseRepository.save(license);

        // Enviar email de bienvenida al admin de la empresa
        String adminName = request.getAdminFirstName() + " " + request.getAdminLastName();
        String adminEmail = request.getAdminEmail() != null ? request.getAdminEmail() : request.getEmail();
        String tempPassword = request.getAdminPassword() != null && !request.getAdminPassword().isBlank()
                ? request.getAdminPassword()
                : generateTempPassword();

        // ============================================================
        // Aprovisionar el acceso del admin en el aplicativo de empresas:
        // se crea la empresa (companies), la sucursal principal (branches)
        // y el usuario administrador (users) con la contraseña elegida.
        // Sin esto, las credenciales enviadas por email no funcionan.
        // ============================================================
        if (userRepository.existsByEmail(adminEmail) || userRepository.existsByUsername(adminEmail)) {
            throw new AdminBusinessException(
                    "El email del administrador ya está registrado como usuario del sistema");
        }

        provisionAdminUser(tenant, adminEmail, request.getAdminFirstName(),
                request.getAdminLastName(), tempPassword, request.getAdminPhone());

        emailService.sendWelcomeEmail(adminEmail, request.getBusinessName(), adminName, tempPassword);

        return toResponse(tenant);
    }

    @Transactional
    public TenantResponse updateTenantStatus(UUID id, String status, String reason) {
        Tenant tenant = tenantRepository.findById(id)
                .orElseThrow(() -> new AdminBusinessException("Empresa no encontrada"));
        if (status == null || !List.of("TRIAL", "ACTIVE", "SUSPENDED", "CANCELLED").contains(status)) {
            throw new AdminBusinessException(
                    "Estado inválido. Válidos: TRIAL, ACTIVE, SUSPENDED, CANCELLED");
        }
        tenant.setStatus(status);
        tenant.setSuspensionReason(reason);
        switch (status) {
            case "SUSPENDED" -> tenant.setSuspendedAt(LocalDateTime.now());
            case "CANCELLED" -> tenant.setCancelledAt(LocalDateTime.now());
            case "ACTIVE" -> {
                tenant.setActivatedAt(LocalDateTime.now());
                tenant.setSuspensionReason(null); // Al reactivar se limpia el motivo
            }
        }
        tenant = tenantRepository.save(tenant);
        return toResponse(tenant);
    }

    /**
     * Genera un token JWT de impersonation para acceder al panel de la empresa.
     * El token tiene duración de 2h, no es renovable, y queda registrado en auditoría.
     * Se impersona el usuario administrador real del tenant (el creado al registrar la empresa).
     */
    public String generateImpersonationToken(UUID tenantId, AdminUser adminUser, String reason) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new AdminBusinessException("Empresa no encontrada"));

        UUID tenantUserId = resolveTenantAdminUserId(tenant);
        return tokenProvider.generateImpersonationToken(
                tenantUserId, tenantId, adminUser.getId(), reason);
    }

    /**
     * Crea o actualiza el usuario administrador de la empresa en el aplicativo de clientes.
     * Asegura la existencia de companies/branches (los crea si el tenant es antiguo),
     * crea el usuario si no existe, o actualiza su contraseña/datos si ya existe.
     * Guarda la referencia admin_email/admin_user_id en el tenant.
     *
     * @return el usuario administrador provisionado
     */
    private User provisionAdminUser(Tenant tenant, String adminEmail, String firstName,
                                    String lastName, String password, String phone) {
        // 1. Empresa (companies) — buscar por NIT o crear
        Company company = companyRepository.findByNit(tenant.getNit())
                .orElseGet(() -> companyRepository.save(Company.builder()
                        .name(tenant.getBusinessName())
                        .tradeName(tenant.getTradeName())
                        .nit(tenant.getNit())
                        .dv(tenant.getDv())
                        .personType(tenant.getPersonType())
                        .taxRegime(tenant.getTaxRegime())
                        .ciiuCode(tenant.getCiiuCode())
                        .address(tenant.getAddress())
                        .phone(tenant.getPhone())
                        .email(tenant.getEmail())
                        .website(tenant.getWebsite())
                        .active(true)
                        .build()));

        // 2. Sucursal principal — primera activa o crear BCG-01
        Branch branch = branchRepository.findByCompanyIdAndActiveTrue(company.getId()).stream()
                .findFirst()
                .orElseGet(() -> branchRepository.save(Branch.builder()
                        .company(company)
                        .code("BCG-01")
                        .name(tenant.getTradeName() != null ? tenant.getTradeName() : tenant.getBusinessName())
                        .address(tenant.getAddress())
                        .phone(tenant.getPhone())
                        .email(tenant.getEmail())
                        .active(true)
                        .build()));

        // 3. Usuario — buscar por email o crear; si existe, actualizar credenciales
        User user = userRepository.findByEmail(adminEmail).orElse(null);
        if (user != null) {
            user.setFirstName(firstName);
            user.setLastName(lastName);
            user.setPhone(phone);
            user.setBranch(branch);
            user.setRoleId((short) 2); // AD
            user.setPasswordHash(passwordEncoder.encode(password));
            user.setMustChangePassword(true);
            user.setActive(true);
            user.setFailedAttempts((short) 0);
            user.setLockedUntil(null);
            user = userRepository.save(user);
        } else {
            user = userRepository.save(User.builder()
                    .branch(branch)
                    .roleId((short) 2) // AD
                    .firstName(firstName)
                    .lastName(lastName)
                    .email(adminEmail)
                    .username(adminEmail)
                    .passwordHash(passwordEncoder.encode(password))
                    .phone(phone)
                    .active(true)
                    .mustChangePassword(true) // Contraseña temporal: forzar cambio en primer login
                    .failedAttempts((short) 0)
                    .build());
        }

        // Guardar referencia del admin en el tenant para impersonación
        tenant.setAdminEmail(adminEmail);
        tenant.setAdminUserId(user.getId());
        tenantRepository.save(tenant);
        return user;
    }

    /**
     * Asigna (o reasigna) la contraseña del usuario administrador de la empresa.
     * Si la empresa no tiene usuario provisionado, lo crea junto con companies/branches.
     * Si no se indica contraseña, genera una temporal segura.
     */
    @Transactional
    public Map<String, Object> resetTenantAdminPassword(UUID tenantId, String password) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new AdminBusinessException("Empresa no encontrada"));

        String adminEmail = tenant.getAdminEmail() != null ? tenant.getAdminEmail() : tenant.getEmail();
        String effectivePassword = password != null && !password.isBlank()
                ? password
                : generateTempPassword();

        // Conservar nombres del usuario existente si lo hay
        String firstName = "Admin";
        String lastName = tenant.getBusinessName();
        if (tenant.getAdminUserId() != null) {
            User existing = userRepository.findById(tenant.getAdminUserId()).orElse(null);
            if (existing != null) {
                firstName = existing.getFirstName();
                lastName = existing.getLastName();
            }
        }

        User user = provisionAdminUser(tenant, adminEmail, firstName, lastName,
                effectivePassword, null);

        Map<String, Object> result = new java.util.HashMap<>();
        result.put("userId", user.getId());
        result.put("email", adminEmail);
        result.put("firstName", user.getFirstName());
        result.put("lastName", user.getLastName());
        result.put("mustChangePassword", true);
        // Solo se devuelve la contraseña temporal si fue generada automáticamente
        result.put("tempPassword", password == null || password.isBlank() ? effectivePassword : null);
        return result;
    }

    /** Lista los usuarios del aplicativo de empresas (panel cliente) del tenant. */
    @Transactional(readOnly = true)
    public List<com.escriba.pos.dto.response.UserResponse> listTenantUsers(UUID tenantId) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new AdminBusinessException("Empresa no encontrada"));
        return companyRepository.findByNit(tenant.getNit())
                .map(company -> userRepository.findByCompanyId(company.getId()).stream()
                        .map(this::toUserResponse)
                        .collect(java.util.stream.Collectors.toList()))
                .orElse(List.of());
    }

    private com.escriba.pos.dto.response.UserResponse toUserResponse(User user) {
        return com.escriba.pos.dto.response.UserResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .username(user.getUsername())
                .phone(user.getPhone())
                .roleId(user.getRoleId())
                .roleCode(user.getRole() != null ? user.getRole().name() : null)
                .roleName(user.getRole() != null ? user.getRole().getDisplayName() : null)
                .active(user.getActive())
                .mustChangePassword(user.getMustChangePassword())
                .lastLogin(user.getLastLogin())
                .createdAt(user.getCreatedAt())
                .build();
    }

    /**
     * Resuelve el ID del usuario administrador real del tenant.
     * Prioriza admin_user_id; si no existe, lo busca por admin_email en users.
     */
    private UUID resolveTenantAdminUserId(Tenant tenant) {
        if (tenant.getAdminUserId() != null) {
            return tenant.getAdminUserId();
        }
        String adminEmail = tenant.getAdminEmail() != null ? tenant.getAdminEmail() : tenant.getEmail();
        return userRepository.findByEmail(adminEmail)
                .map(User::getId)
                .orElseThrow(() -> new AdminBusinessException(
                        "El tenant no tiene un usuario administrador provisionado. " +
                        "Registra o crea un usuario admin para esta empresa."));
    }

    /** Genera una contraseña temporal segura de 12 caracteres. */
    private String generateTempPassword() {
        StringBuilder sb = new StringBuilder(12);
        for (int i = 0; i < 12; i++) {
            sb.append(PASSWORD_CHARS.charAt(SECURE_RANDOM.nextInt(PASSWORD_CHARS.length())));
        }
        return sb.toString();
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
                .adminEmail(tenant.getAdminEmail())
                .adminUserId(tenant.getAdminUserId())
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
