package com.escriba.pos.admin.service;

import com.escriba.pos.admin.exception.AdminBusinessException;
import com.escriba.pos.admin.model.dto.request.CreateLicenseRequest;
import com.escriba.pos.admin.model.dto.request.UpdateLicenseRequest;
import com.escriba.pos.admin.model.dto.response.LicenseResponse;
import com.escriba.pos.admin.model.entity.AdminUser;
import com.escriba.pos.admin.model.entity.License;
import com.escriba.pos.admin.model.entity.LicenseHistory;
import com.escriba.pos.admin.model.entity.Plan;
import com.escriba.pos.admin.model.entity.Tenant;
import com.escriba.pos.admin.repository.LicenseHistoryRepository;
import com.escriba.pos.admin.repository.LicenseRepository;
import com.escriba.pos.admin.repository.PlanRepository;
import com.escriba.pos.admin.repository.TenantInvoiceRepository;
import com.escriba.pos.admin.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LicenseService {

    private final LicenseRepository licenseRepository;
    private final LicenseHistoryRepository licenseHistoryRepository;
    private final TenantRepository tenantRepository;
    private final TenantInvoiceRepository invoiceRepository;
    private final PlanRepository planRepository;

    @Transactional(readOnly = true)
    public Page<LicenseResponse> listLicenses(UUID tenantId, String status, int page, int size) {
        return licenseRepository.findByFilters(tenantId, status, PageRequest.of(page, size))
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public LicenseResponse getLicense(UUID id) {
        License license = licenseRepository.findById(id)
                .orElseThrow(() -> new AdminBusinessException("Licencia no encontrada"));
        return toResponse(license);
    }

    @Transactional
    public LicenseResponse createLicense(CreateLicenseRequest request, AdminUser createdBy) {
        Tenant tenant = tenantRepository.findById(request.getTenantId())
                .orElseThrow(() -> new AdminBusinessException("Empresa no encontrada"));
        Plan plan = planRepository.findById(request.getPlanId())
                .orElseThrow(() -> new AdminBusinessException("Plan no encontrado"));

        License license = License.builder()
                .tenant(tenant)
                .plan(plan)
                .licenseType(request.getLicenseType())
                .status("ACTIVE")
                .startsAt(request.getStartDate().atStartOfDay())
                .expiresAt(request.getStartDate().plusMonths(request.getDurationMonths()).atStartOfDay())
                .autoRenew(request.isAutoRenew())
                .gracePeriodDays(request.getGracePeriodDays())
                .pricePaidMonthly(plan.getPriceMonthly())
                .discountPct(request.getDiscountPct())
                .discountReason(request.getDiscountReason())
                .notes(request.getNotes())
                .createdBy(createdBy)
                .build();

        license = licenseRepository.save(license);
        return toResponse(license);
    }

    @Transactional
    public LicenseResponse updateLicense(UUID id, UpdateLicenseRequest request) {
        License license = licenseRepository.findById(id)
                .orElseThrow(() -> new AdminBusinessException("Licencia no encontrada"));

        String oldStatus = license.getStatus();

        if (request.getPlanId() != null && !request.getPlanId().equals(license.getPlan().getId())) {
            Plan newPlan = planRepository.findById(request.getPlanId())
                    .orElseThrow(() -> new AdminBusinessException("Plan no encontrado"));
            license.setPlan(newPlan);
            license.setPricePaidMonthly(newPlan.getPriceMonthly());
        }
        if (request.getLicenseType() != null && !request.getLicenseType().isBlank()) {
            license.setLicenseType(request.getLicenseType());
        }
        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            license.setStatus(request.getStatus());
        }
        if (request.getStartsAt() != null) {
            license.setStartsAt(request.getStartsAt().atStartOfDay());
        }
        if (request.getExpiresAt() != null) {
            license.setExpiresAt(request.getExpiresAt().atStartOfDay());
        }
        if (request.getAutoRenew() != null) {
            license.setAutoRenew(request.getAutoRenew());
        }
        if (request.getGracePeriodDays() != null && request.getGracePeriodDays() >= 0) {
            license.setGracePeriodDays(request.getGracePeriodDays());
        }
        if (request.getDiscountPct() != null) {
            license.setDiscountPct(request.getDiscountPct());
        }
        if (request.getDiscountReason() != null) {
            license.setDiscountReason(request.getDiscountReason());
        }
        if (request.getNotes() != null) {
            license.setNotes(request.getNotes());
        }

        license = licenseRepository.save(license);
        saveHistory(license, "UPDATED", oldStatus, license.getStatus());
        return toResponse(license);
    }

    @Transactional
    public void deleteLicense(UUID id) {
        License license = licenseRepository.findById(id)
                .orElseThrow(() -> new AdminBusinessException("Licencia no encontrada"));
        // Desvincular facturas asociadas antes de eliminar (evita violación de FK)
        invoiceRepository.detachFromLicense(id);
        // El historial de la licencia se elimina en cascada (ON DELETE CASCADE)
        licenseRepository.delete(license);
    }

    @Transactional
    public LicenseResponse renewLicense(UUID id) {
        License license = licenseRepository.findById(id)
                .orElseThrow(() -> new AdminBusinessException("Licencia no encontrada"));
        LocalDateTime oldExpiry = license.getExpiresAt();

        license.setExpiresAt(license.getExpiresAt().plusMonths(1));
        license.setStatus("ACTIVE");
        license = licenseRepository.save(license);

        saveHistory(license, "RENEWED", oldExpiry, license.getExpiresAt());
        return toResponse(license);
    }

    @Transactional
    public LicenseResponse changePlan(UUID id, Integer newPlanId) {
        License license = licenseRepository.findById(id)
                .orElseThrow(() -> new AdminBusinessException("Licencia no encontrada"));
        Plan newPlan = planRepository.findById(newPlanId)
                .orElseThrow(() -> new AdminBusinessException("Plan no encontrado"));

        Integer oldPlanId = license.getPlan().getId();
        license.setPlan(newPlan);
        license.setPricePaidMonthly(newPlan.getPriceMonthly());
        license = licenseRepository.save(license);

        saveHistory(license, "PLAN_CHANGED", oldPlanId, newPlanId);
        return toResponse(license);
    }

    @Transactional
    public LicenseResponse updateStatus(UUID id, String status) {
        License license = licenseRepository.findById(id)
                .orElseThrow(() -> new AdminBusinessException("Licencia no encontrada"));
        String oldStatus = license.getStatus();
        license.setStatus(status);
        license = licenseRepository.save(license);
        saveHistory(license, "STATUS_" + status, oldStatus, status);
        return toResponse(license);
    }

    private void saveHistory(License license, String changeType, Object oldVal, Object newVal) {
        LicenseHistory history = LicenseHistory.builder()
                .license(license)
                .changeType(changeType)
                .oldValue(convertToJson(oldVal))
                .newValue(convertToJson(newVal))
                .build();
        licenseHistoryRepository.save(history);
    }

    private String convertToJson(Object value) {
        if (value == null) return null;
        return "{\"value\":\"" + value.toString() + "\"}";
    }

    private LicenseResponse toResponse(License license) {
        return LicenseResponse.builder()
                .id(license.getId())
                .tenantId(license.getTenant().getId())
                .tenantName(license.getTenant().getBusinessName())
                .planId(license.getPlan().getId())
                .planName(license.getPlan().getName())
                .licenseType(license.getLicenseType())
                .status(license.getStatus())
                .startsAt(license.getStartsAt())
                .expiresAt(license.getExpiresAt())
                .autoRenew(Boolean.TRUE.equals(license.getAutoRenew()))
                .gracePeriodDays(license.getGracePeriodDays())
                .pricePaidMonthly(license.getPricePaidMonthly())
                .discountPct(license.getDiscountPct())
                .discountReason(license.getDiscountReason())
                .notes(license.getNotes())
                .createdAt(license.getCreatedAt())
                .build();
    }
}
