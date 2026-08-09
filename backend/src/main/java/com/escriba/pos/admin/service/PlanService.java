package com.escriba.pos.admin.service;

import com.escriba.pos.admin.model.dto.request.CreatePlanRequest;
import com.escriba.pos.admin.model.dto.response.PlanModuleResponse;
import com.escriba.pos.admin.model.dto.response.PlanResponse;
import com.escriba.pos.admin.model.entity.AdminUser;
import com.escriba.pos.admin.model.entity.Plan;
import com.escriba.pos.admin.model.entity.PlanModule;
import com.escriba.pos.admin.repository.ModuleRepository;
import com.escriba.pos.admin.repository.PlanModuleRepository;
import com.escriba.pos.admin.repository.PlanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PlanService {

    private final PlanRepository planRepository;
    private final PlanModuleRepository planModuleRepository;
    private final ModuleRepository moduleRepository;

    public List<PlanResponse> listActivePlans() {
        return planRepository.findByStatusOrderByName("ACTIVE")
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<PlanResponse> listPlansByStatus(String status) {
        return planRepository.findByStatusOrderByName(status).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public PlanResponse getPlan(Integer id) {
        Plan plan = planRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Plan no encontrado"));
        return toResponse(plan);
    }

    @Transactional
    public PlanResponse createPlan(CreatePlanRequest request, AdminUser createdBy) {
        Plan plan = Plan.builder()
                .name(request.getName())
                .slug(request.getName().toLowerCase().replaceAll("\\s+", "-"))
                .descriptionShort(request.getDescriptionShort())
                .descriptionLong(request.getDescriptionLong())
                .priceMonthly(request.getPriceMonthly())
                .priceAnnual(request.getPriceAnnual())
                .taxRate(request.getTaxRate() != null ? request.getTaxRate() : new java.math.BigDecimal("19"))
                .badgeColor(request.getBadgeColor())
                .isFeatured(request.isFeatured())
                .isVisibleWeb(request.isVisibleWeb())
                .trialDays(request.getTrialDays())
                .maxUsers(request.getMaxUsers())
                .maxBranches(request.getMaxBranches())
                .maxProducts(request.getMaxProducts())
                .maxMonthlyInvoices(request.getMaxMonthlyInvoices())
                .storageGb(request.getStorageGb())
                .supportLevel(request.getSupportLevel())
                .createdBy(createdBy)
                .build();

        plan = planRepository.save(plan);

        // Guardar módulos del plan
        if (request.getModules() != null) {
            for (String moduleCode : request.getModules()) {
                PlanModule pm = PlanModule.builder()
                        .plan(plan)
                        .moduleCode(moduleCode)
                        .isIncluded(true)
                        .build();
                planModuleRepository.save(pm);
            }
        }

        return toResponse(plan);
    }

    @Transactional
    public PlanResponse updatePlan(Integer id, CreatePlanRequest request) {
        Plan plan = planRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Plan no encontrado"));

        plan.setName(request.getName());
        plan.setSlug(request.getName().toLowerCase().replaceAll("\\s+", "-"));
        plan.setDescriptionShort(request.getDescriptionShort());
        plan.setDescriptionLong(request.getDescriptionLong());
        plan.setPriceMonthly(request.getPriceMonthly());
        plan.setPriceAnnual(request.getPriceAnnual());
        plan.setBadgeColor(request.getBadgeColor());
        plan.setIsFeatured(request.isFeatured());
        plan.setIsVisibleWeb(request.isVisibleWeb());
        plan.setTrialDays(request.getTrialDays());
        plan.setMaxUsers(request.getMaxUsers());
        plan.setMaxBranches(request.getMaxBranches());
        plan.setMaxProducts(request.getMaxProducts());
        plan.setMaxMonthlyInvoices(request.getMaxMonthlyInvoices());
        plan.setStorageGb(request.getStorageGb());
        plan.setSupportLevel(request.getSupportLevel());

        plan = planRepository.save(plan);

        // Actualizar módulos: eliminar existentes y agregar nuevos
        planModuleRepository.deleteByPlanId(plan.getId());
        if (request.getModules() != null) {
            for (String moduleCode : request.getModules()) {
                PlanModule pm = PlanModule.builder()
                        .plan(plan)
                        .moduleCode(moduleCode)
                        .isIncluded(true)
                        .build();
                planModuleRepository.save(pm);
            }
        }

        return toResponse(plan);
    }

    @Transactional
    public PlanResponse archivePlan(Integer id) {
        Plan plan = planRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Plan no encontrado"));
        plan.setStatus("ARCHIVED");
        plan = planRepository.save(plan);
        return toResponse(plan);
    }

    private PlanResponse toResponse(Plan plan) {
        List<PlanModule> planModules = planModuleRepository.findByPlanId(plan.getId());
        List<PlanModuleResponse> modules = planModules.stream()
                .map(pm -> {
                            var r = new PlanModuleResponse(pm.getModuleCode(), pm.getModuleCode(), Boolean.TRUE.equals(pm.getIsIncluded()), "");
                            return r;
                        })
                .collect(Collectors.toList());

        // Calcular descuento anual
        BigDecimal annualDiscountPct = BigDecimal.ZERO;
        if (plan.getPriceMonthly().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal annualRaw = plan.getPriceMonthly().multiply(BigDecimal.valueOf(12));
            annualDiscountPct = annualRaw.subtract(plan.getPriceAnnual())
                    .multiply(BigDecimal.valueOf(100))
                    .divide(annualRaw, 2, java.math.RoundingMode.HALF_UP);
        }

        return PlanResponse.builder()
                .id(plan.getId())
                .name(plan.getName())
                .slug(plan.getSlug())
                .descriptionShort(plan.getDescriptionShort())
                .priceMonthly(plan.getPriceMonthly())
                .priceAnnual(plan.getPriceAnnual())
                .taxRate(plan.getTaxRate())
                .annualDiscountPct(annualDiscountPct)
                .trialDays(plan.getTrialDays())
                .badgeColor(plan.getBadgeColor())
                .isFeatured(Boolean.TRUE.equals(plan.getIsFeatured()))
                .isVisibleWeb(Boolean.TRUE.equals(plan.getIsVisibleWeb()))
                .status(plan.getStatus())
                .maxUsers(plan.getMaxUsers())
                .maxBranches(plan.getMaxBranches())
                .maxProducts(plan.getMaxProducts())
                .maxMonthlyInvoices(plan.getMaxMonthlyInvoices())
                .storageGb(plan.getStorageGb())
                .supportLevel(plan.getSupportLevel())
                .modules(modules)
                .createdAt(plan.getCreatedAt())
                .build();
    }
}
