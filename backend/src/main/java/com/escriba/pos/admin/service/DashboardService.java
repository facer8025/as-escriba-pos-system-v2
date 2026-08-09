package com.escriba.pos.admin.service;

import com.escriba.pos.admin.model.dto.response.DashboardKpiResponse;
import com.escriba.pos.admin.model.dto.response.RecentActivityResponse;
import com.escriba.pos.admin.model.dto.response.ServiceHealthResponse;
import com.escriba.pos.admin.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final TenantRepository tenantRepository;
    private final LicenseRepository licenseRepository;
    private final SupportTicketRepository ticketRepository;
    private final AdminAuditLogRepository auditLogRepository;

    public DashboardKpiResponse getKPIs() {
        long activeCompanies = tenantRepository.countByStatus("ACTIVE");
        long trialCompanies = tenantRepository.countByStatus("TRIAL");
        long suspendedCompanies = tenantRepository.countByStatus("SUSPENDED");
        Long mrrLong = licenseRepository.calculateMRR();
        BigDecimal mrr = mrrLong != null ? BigDecimal.valueOf(mrrLong) : BigDecimal.ZERO;
        BigDecimal arr = mrr.multiply(BigDecimal.valueOf(12));
        long newContractsMonth = tenantRepository.countByStatus("ACTIVE"); // simplified
        long licensesExpiring30d = licenseRepository.countByExpiresAtBetween(
                LocalDateTime.now(), LocalDateTime.now().plusDays(30));
        long openTickets = ticketRepository.countByStatusNot("CLOSED");

        List<ServiceHealthResponse> services = List.of(
                ServiceHealthResponse.builder().serviceName("API Principal").status("UP").uptime30d(99.8).build(),
                ServiceHealthResponse.builder().serviceName("Base de datos").status("UP").uptime30d(99.9).build(),
                ServiceHealthResponse.builder().serviceName("Proveedor DIAN").status("DEGRADED").uptime30d(97.2).lastIncident("Hace 2h").build(),
                ServiceHealthResponse.builder().serviceName("Servicio de email").status("UP").uptime30d(99.7).build(),
                ServiceHealthResponse.builder().serviceName("MinIO (almacenamiento)").status("UP").uptime30d(99.9).build(),
                ServiceHealthResponse.builder().serviceName("RabbitMQ").status("UP").uptime30d(99.8).build()
        );

        List<RecentActivityResponse> recentActivity = List.of(
                RecentActivityResponse.builder().user("Admin").action("consultó el dashboard").target("Sistema").time("ahora").module("Dashboard").build()
        );

        return DashboardKpiResponse.builder()
                .activeCompanies(activeCompanies)
                .trialCompanies(trialCompanies)
                .suspendedCompanies(suspendedCompanies)
                .mrr(mrr)
                .arr(arr)
                .newContractsMonth(newContractsMonth)
                .licensesExpiring30d(licensesExpiring30d)
                .openTickets(openTickets)
                .services(services)
                .recentActivity(recentActivity)
                .build();
    }
}
