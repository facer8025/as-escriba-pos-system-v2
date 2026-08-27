package com.escriba.pos.admin.service;

import com.escriba.pos.admin.model.dto.response.MonitoringResponse;
import com.escriba.pos.admin.model.dto.response.ServiceHealthDTO;
import com.escriba.pos.admin.model.dto.response.SystemMetricsDTO;
import com.escriba.pos.admin.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MonitoringService {

    private final TenantRepository tenantRepository;
    private final LicenseRepository licenseRepository;
    private final SupportTicketRepository ticketRepository;
    private final TenantInvoiceRepository invoiceRepository;
    private final ServiceHealthLogRepository healthLogRepository;
    private final HealthCheckService healthCheckService;
    private final com.escriba.pos.repository.ElectronicDocumentRepository electronicDocRepository;

    public MonitoringResponse getDashboard() {
        LocalDateTime now = LocalDateTime.now();

        // ── Service Health con datos reales ─────────────────────────
        String[][] defaultServices = {
            {"API REST", "UP"},
            {"PostgreSQL", "UP"},
            {"Redis", "UP"},
            {"Email SMTP", "UP"},
        };

        List<ServiceHealthDTO> services = new ArrayList<>();
        for (String[] svc : defaultServices) {
            String latestStatus = healthLogRepository.findLatestStatusByService(svc[0]);
            String status = latestStatus != null ? latestStatus : svc[1];

            double uptime = healthCheckService.calculateUptime30d(svc[0]);

            // Último check
            var recentLogs = healthLogRepository.findRecentByService(svc[0], now.minusHours(1));
            int responseTime = recentLogs.isEmpty() ? 0 :
                    (recentLogs.get(0).getResponseTimeMs() != null ? recentLogs.get(0).getResponseTimeMs() : 0);
            LocalDateTime lastCheck = recentLogs.isEmpty() ? null : recentLogs.get(0).getCheckedAt();

            // Último incidente
            var errorLogs = healthLogRepository.findRecentByService(svc[0], now.minusDays(30));
            String lastIncident = null;
            for (var log : errorLogs) {
                if (!"UP".equals(log.getStatus()) && log.getErrorMessage() != null) {
                    lastIncident = "Hace " + java.time.Duration.between(log.getCheckedAt(), now).toHours() + "h";
                    break;
                }
            }

            services.add(ServiceHealthDTO.builder()
                    .serviceName(svc[0])
                    .status(status)
                    .uptime30d(uptime)
                    .responseTimeMs(responseTime)
                    .lastIncident(lastIncident)
                    .lastCheck(lastCheck != null ? lastCheck : now)
                    .build());
        }

        // ── System Metrics ──────────────────────────────────────────
        long totalTenants = tenantRepository.count();
        long activeTenants = tenantRepository.countByStatus("ACTIVE");
        long totalLicenses = licenseRepository.count();
        long activeLicenses = licenseRepository.countByStatus("ACTIVE");
        long ticketsOpen = ticketRepository.countByStatusNot("CLOSED");
        long invoicesToday = invoiceRepository.countByCreatedAtAfter(now.withHour(0).withMinute(0));

        // Ejecutar health check bajo demanda para la última data
        try {
            healthCheckService.checkDatabase();
        } catch (Exception ignored) {}

        SystemMetricsDTO metrics = SystemMetricsDTO.builder()
                .totalTenants(totalTenants)
                .activeTenants(activeTenants)
                .totalLicenses(totalLicenses)
                .activeLicenses(activeLicenses)
                .ticketsOpen(ticketsOpen)
                .invoicesToday(invoicesToday)
                .storageUsedMb(0)
                .apiRequestsToday(0)
                .build();

        // ── DIAN Queue ──────────────────────────────────────────────
        long dianPending = 0;
        try {
            dianPending = electronicDocRepository.countByDianStatus("PENDING");
        } catch (Exception ignored) {}
        List<String> recentErrors = new ArrayList<>();
        var recentDownLogs = healthLogRepository.findRecentErrors(now.minusDays(7));
        // Deduplicar: un solo ítem por servicio+mensaje (evita 20 líneas idénticas cada 5 min)
        java.util.LinkedHashMap<String, String> seen = new java.util.LinkedHashMap<>();
        for (var log : recentDownLogs) {
            String msg = log.getErrorMessage() != null ? log.getErrorMessage() : "Sin respuesta";
            String key = log.getServiceName() + "|" + msg;
            if (seen.containsKey(key)) continue;
            String entry = "[" + log.getServiceName() + "] " + msg +
                    " — " + java.time.Duration.between(log.getCheckedAt(), now).toHours() + "h atrás";
            seen.put(key, entry);
        }
        recentErrors.addAll(seen.values());
        if (recentErrors.size() > 20) recentErrors = recentErrors.subList(0, 20);

        return MonitoringResponse.builder()
                .services(services)
                .metrics(metrics)
                .recentErrors(recentErrors)
                .build();
    }
}
