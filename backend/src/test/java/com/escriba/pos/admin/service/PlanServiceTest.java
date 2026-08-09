package com.escriba.pos.admin.service;

import com.escriba.pos.admin.model.dto.request.CreatePlanRequest;
import com.escriba.pos.admin.model.dto.response.PlanResponse;
import com.escriba.pos.admin.model.entity.AdminUser;
import com.escriba.pos.admin.model.entity.Plan;
import com.escriba.pos.admin.repository.ModuleRepository;
import com.escriba.pos.admin.repository.PlanModuleRepository;
import com.escriba.pos.admin.repository.PlanRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PlanServiceTest {

    @Mock private PlanRepository planRepository;
    @Mock private PlanModuleRepository planModuleRepository;
    @Mock private ModuleRepository moduleRepository;

    private PlanService planService;
    private AdminUser admin;

    @BeforeEach
    void setUp() {
        planService = new PlanService(planRepository, planModuleRepository, moduleRepository);
        admin = AdminUser.builder().email("admin@escriba.co").build();
    }

    private CreatePlanRequest planRequest() {
        CreatePlanRequest req = new CreatePlanRequest();
        req.setName("Plan Pro");
        req.setDescriptionShort("Para empresas medianas");
        req.setPriceMonthly(new BigDecimal("150000"));
        req.setPriceAnnual(new BigDecimal("1500000"));
        req.setMaxUsers(10);
        req.setMaxBranches(3);
        req.setMaxProducts(5000);
        req.setModules(List.of("POS", "INVENTORY"));
        return req;
    }

    private Plan planEntity() {
        return Plan.builder()
                .id(1)
                .name("Plan Pro")
                .slug("plan-pro")
                .descriptionShort("Para empresas medianas")
                .priceMonthly(new BigDecimal("150000"))
                .priceAnnual(new BigDecimal("1500000"))
                .taxRate(new BigDecimal("19"))
                .status("ACTIVE")
                .createdBy(admin)
                .build();
    }

    @Test
    @DisplayName("createPlan sin taxRate usa el IVA por defecto 19%")
    void createPlan_sinTaxRate_usaDefault19() {
        when(planRepository.save(any(Plan.class))).thenAnswer(inv -> inv.getArgument(0));

        CreatePlanRequest req = planRequest(); // taxRate null
        planService.createPlan(req, admin);

        ArgumentCaptor<Plan> captor = ArgumentCaptor.forClass(Plan.class);
        verify(planRepository, times(1)).save(captor.capture());
        Plan created = captor.getValue();
        assertEquals(new BigDecimal("19"), created.getTaxRate());
        assertEquals("plan-pro", created.getSlug());
        assertEquals("ACTIVE", created.getStatus());
        // Se guardan los módulos del plan
        verify(planModuleRepository, times(2)).save(any());
    }

    @Test
    @DisplayName("createPlan con taxRate explícito respeta el valor")
    void createPlan_conTaxRate_respetaValor() {
        when(planRepository.save(any(Plan.class))).thenAnswer(inv -> inv.getArgument(0));

        CreatePlanRequest req = planRequest();
        req.setTaxRate(new BigDecimal("5")); // IVA reducido

        planService.createPlan(req, admin);

        ArgumentCaptor<Plan> captor = ArgumentCaptor.forClass(Plan.class);
        verify(planRepository, times(1)).save(captor.capture());
        assertEquals(new BigDecimal("5"), captor.getValue().getTaxRate());
    }

    @Test
    @DisplayName("createPlan con módulos nulos no intenta guardarlos")
    void createPlan_sinModulos_noGuardaPlanModule() {
        when(planRepository.save(any(Plan.class))).thenAnswer(inv -> inv.getArgument(0));

        CreatePlanRequest req = planRequest();
        req.setModules(null);

        planService.createPlan(req, admin);
        verify(planModuleRepository, never()).save(any());
    }

    @Test
    @DisplayName("updatePlan actualiza datos y reemplaza módulos")
    void updatePlan_actualizaYReemplazaModulos() {
        Plan existing = planEntity();
        when(planRepository.findById(1)).thenReturn(Optional.of(existing));
        when(planRepository.save(any(Plan.class))).thenAnswer(inv -> inv.getArgument(0));

        CreatePlanRequest req = planRequest();
        req.setName("Plan Empresarial");
        req.setPriceMonthly(new BigDecimal("300000"));
        req.setModules(List.of("POS", "INVENTORY", "DIAN"));

        planService.updatePlan(1, req);

        assertEquals("Plan Empresarial", existing.getName());
        assertEquals("plan-empresarial", existing.getSlug());
        assertEquals(new BigDecimal("300000"), existing.getPriceMonthly());
        verify(planModuleRepository, times(1)).deleteByPlanId(1);
        verify(planModuleRepository, times(3)).save(any());
    }

    @Test
    @DisplayName("updatePlan con plan inexistente lanza RuntimeException")
    void updatePlan_planNoEncontrado_lanzaExcepcion() {
        when(planRepository.findById(99)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> planService.updatePlan(99, planRequest()));
    }

    @Test
    @DisplayName("archivePlan cambia estado a ARCHIVED")
    void archivePlan_cambiaEstado() {
        Plan plan = planEntity();
        when(planRepository.findById(1)).thenReturn(Optional.of(plan));
        when(planRepository.save(any(Plan.class))).thenAnswer(inv -> inv.getArgument(0));

        PlanResponse response = planService.archivePlan(1);

        assertEquals("ARCHIVED", plan.getStatus());
        assertEquals("ARCHIVED", response.getStatus());
    }

    @Test
    @DisplayName("toResponse calcula el descuento anual correctamente")
    void toResponse_calculaDescuentoAnual() {
        // Mensual 150.000 → anual sin descuento 1.800.000; precio anual 1.500.000 → 16.67%
        Plan plan = planEntity();
        when(planRepository.findById(1)).thenReturn(Optional.of(plan));
        when(planModuleRepository.findByPlanId(1)).thenReturn(List.of());

        PlanResponse response = planService.getPlan(1);

        assertEquals(new BigDecimal("16.67"), response.getAnnualDiscountPct());
        assertEquals(new BigDecimal("19"), response.getTaxRate());
        assertEquals("plan-pro", response.getSlug());
        assertTrue(response.getModules().isEmpty());
    }

    @Test
    @DisplayName("listActivePlans retorna solo planes activos")
    void listActivePlans_retornaActivos() {
        Plan active = planEntity();
        when(planRepository.findByStatusOrderByName("ACTIVE")).thenReturn(List.of(active));
        when(planModuleRepository.findByPlanId(1)).thenReturn(List.of());

        List<PlanResponse> plans = planService.listActivePlans();

        assertEquals(1, plans.size());
        assertEquals("Plan Pro", plans.get(0).getName());
        verify(planRepository, never()).findAll();
    }
}
