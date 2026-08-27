package com.escriba.pos.admin.service;

import com.escriba.pos.admin.model.dto.request.CreateLicenseRequest;
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LicenseServiceTest {

    @Mock private LicenseRepository licenseRepository;
    @Mock private LicenseHistoryRepository licenseHistoryRepository;
    @Mock private TenantRepository tenantRepository;
    @Mock private TenantInvoiceRepository invoiceRepository;
    @Mock private PlanRepository planRepository;

    private LicenseService licenseService;
    private AdminUser admin;
    private Tenant tenant;
    private Plan plan;
    private License license;
    private UUID licenseId, tenantId;

    @BeforeEach
    void setUp() {
        licenseService = new LicenseService(licenseRepository, licenseHistoryRepository,
                tenantRepository, invoiceRepository, planRepository);

        admin = AdminUser.builder().email("admin@escriba.co").build();
        tenantId = UUID.randomUUID();
        licenseId = UUID.randomUUID();

        tenant = Tenant.builder().id(tenantId).businessName("ESCRIBA SAS").build();
        plan = Plan.builder().id(1).name("Plan Pro").priceMonthly(new BigDecimal("150000")).build();
        license = License.builder()
                .id(licenseId)
                .tenant(tenant)
                .plan(plan)
                .status("ACTIVE")
                .startsAt(LocalDateTime.now().minusDays(30))
                .expiresAt(LocalDateTime.now().plusMonths(1))
                .pricePaidMonthly(new BigDecimal("150000"))
                .build();
    }

    private CreateLicenseRequest licenseRequest() {
        CreateLicenseRequest req = new CreateLicenseRequest();
        req.setTenantId(tenantId);
        req.setPlanId(1);
        req.setLicenseType("PAID");
        req.setStartDate(LocalDate.now());
        req.setDurationMonths(12);
        req.setAutoRenew(true);
        req.setGracePeriodDays(7);
        return req;
    }

    @Test
    @DisplayName("createLicense crea licencia ACTIVE con fechas calculadas")
    void createLicense_creaLicenciaActiva() {
        when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
        when(planRepository.findById(1)).thenReturn(Optional.of(plan));
        when(licenseRepository.save(any(License.class))).thenAnswer(inv -> inv.getArgument(0));

        LicenseResponse response = licenseService.createLicense(licenseRequest(), admin);

        assertEquals("ACTIVE", response.getStatus());
        assertEquals("PAID", response.getLicenseType());

        ArgumentCaptor<License> captor = ArgumentCaptor.forClass(License.class);
        verify(licenseRepository).save(captor.capture());
        License created = captor.getValue();
        assertEquals(LocalDate.now().atStartOfDay(), created.getStartsAt());
        assertEquals(LocalDate.now().plusMonths(12).atStartOfDay(), created.getExpiresAt());
        assertEquals(new BigDecimal("150000"), created.getPricePaidMonthly());
    }

    @Test
    @DisplayName("createLicense con tenant inexistente lanza RuntimeException")
    void createLicense_tenantNoEncontrado_lanzaExcepcion() {
        when(tenantRepository.findById(tenantId)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> licenseService.createLicense(licenseRequest(), admin));
        verify(licenseRepository, never()).save(any());
    }

    @Test
    @DisplayName("renewLicense extiende 1 mes y registra historial RENEWED")
    void renewLicense_extiendeYRegistraHistorial() {
        LocalDateTime oldExpiry = license.getExpiresAt();
        when(licenseRepository.findById(licenseId)).thenReturn(Optional.of(license));
        when(licenseRepository.save(any(License.class))).thenAnswer(inv -> inv.getArgument(0));

        LicenseResponse response = licenseService.renewLicense(licenseId);

        assertEquals(oldExpiry.plusMonths(1), license.getExpiresAt());
        assertEquals("ACTIVE", response.getStatus());

        ArgumentCaptor<LicenseHistory> captor = ArgumentCaptor.forClass(LicenseHistory.class);
        verify(licenseHistoryRepository).save(captor.capture());
        LicenseHistory history = captor.getValue();
        assertEquals("RENEWED", history.getChangeType());
    }

    @Test
    @DisplayName("changePlan cambia plan y precio, registra historial PLAN_CHANGED")
    void changePlan_cambiaPlanYPrecio() {
        Plan newPlan = Plan.builder().id(2).name("Plan Empresarial").priceMonthly(new BigDecimal("300000")).build();
        when(licenseRepository.findById(licenseId)).thenReturn(Optional.of(license));
        when(planRepository.findById(2)).thenReturn(Optional.of(newPlan));
        when(licenseRepository.save(any(License.class))).thenAnswer(inv -> inv.getArgument(0));

        licenseService.changePlan(licenseId, 2);

        assertEquals(2, license.getPlan().getId());
        assertEquals(new BigDecimal("300000"), license.getPricePaidMonthly());

        ArgumentCaptor<LicenseHistory> captor = ArgumentCaptor.forClass(LicenseHistory.class);
        verify(licenseHistoryRepository).save(captor.capture());
        assertEquals("PLAN_CHANGED", captor.getValue().getChangeType());
    }

    @Test
    @DisplayName("changePlan con plan inexistente lanza RuntimeException")
    void changePlan_planNoEncontrado_lanzaExcepcion() {
        when(licenseRepository.findById(licenseId)).thenReturn(Optional.of(license));
        when(planRepository.findById(99)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> licenseService.changePlan(licenseId, 99));
        verify(licenseRepository, never()).save(any());
    }

    @Test
    @DisplayName("updateStatus cambia estado y registra historial STATUS_X")
    void updateStatus_cambiaEstado() {
        when(licenseRepository.findById(licenseId)).thenReturn(Optional.of(license));
        when(licenseRepository.save(any(License.class))).thenAnswer(inv -> inv.getArgument(0));

        licenseService.updateStatus(licenseId, "SUSPENDED");

        assertEquals("SUSPENDED", license.getStatus());

        ArgumentCaptor<LicenseHistory> captor = ArgumentCaptor.forClass(LicenseHistory.class);
        verify(licenseHistoryRepository).save(captor.capture());
        assertEquals("STATUS_SUSPENDED", captor.getValue().getChangeType());
        assertTrue(captor.getValue().getOldValue().contains("ACTIVE"));
        assertTrue(captor.getValue().getNewValue().contains("SUSPENDED"));
    }

    @Test
    @DisplayName("getLicense con id inexistente lanza RuntimeException")
    void getLicense_noEncontrada_lanzaExcepcion() {
        when(licenseRepository.findById(licenseId)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> licenseService.getLicense(licenseId));
    }
}
