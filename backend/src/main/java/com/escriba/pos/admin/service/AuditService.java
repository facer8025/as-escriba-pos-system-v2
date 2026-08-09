package com.escriba.pos.admin.service;

import com.escriba.pos.admin.model.dto.response.AuditLogResponse;
import com.escriba.pos.admin.model.dto.response.SecurityAlertResponse;
import com.escriba.pos.admin.model.entity.AdminAuditLog;
import com.escriba.pos.admin.model.entity.SecurityAlert;
import com.escriba.pos.admin.repository.AdminAuditLogRepository;
import com.escriba.pos.admin.repository.SecurityAlertRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AdminAuditLogRepository auditLogRepository;
    private final SecurityAlertRepository securityAlertRepository;

    public Page<AuditLogResponse> listAuditLogs(String category, String action, String result,
                                                  LocalDateTime fromDate, LocalDateTime toDate,
                                                  int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size);
        return auditLogRepository.findByFilters(category, action, result, fromDate, toDate, pageRequest)
                .map(this::toAuditResponse);
    }

    public AuditLogResponse getAuditLog(Long id) {
        AdminAuditLog log = auditLogRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Log no encontrado"));
        return toAuditResponse(log);
    }

    public Page<SecurityAlertResponse> listSecurityAlerts(String status, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size);
        return securityAlertRepository.findByFilters(status, pageRequest)
                .map(this::toAlertResponse);
    }

    public long countNewAlerts() {
        return securityAlertRepository.countByStatus("NEW");
    }

    public String exportToCsv(String category, String action, String result,
                               LocalDateTime fromDate, LocalDateTime toDate) {
        var logs = auditLogRepository.findByFilters(category, action, result, fromDate, toDate,
                org.springframework.data.domain.PageRequest.of(0, 10000));

        StringBuilder csv = new StringBuilder();
        // BOM para Excel español
        csv.append("\uFEFF");
        // Header
        csv.append("Fecha,Hora,Usuario,Rol,Categoría,Acción,Descripción,Empresa,Módulo,Resultado,IP\n");

        for (var log : logs) {
            csv.append(log.getTimestamp() != null ? log.getTimestamp().toLocalDate() : "").append(",");
            csv.append(log.getTimestamp() != null ? log.getTimestamp().toLocalTime().format(
                    java.time.format.DateTimeFormatter.ofPattern("HH:mm:ss")) : "").append(",");
            csv.append(escapeCsv(log.getAdminEmail())).append(",");
            csv.append(escapeCsv(log.getAdminRole())).append(",");
            csv.append(escapeCsv(log.getCategory())).append(",");
            csv.append(escapeCsv(log.getAction())).append(",");
            csv.append(escapeCsv(log.getDescription())).append(",");
            csv.append(escapeCsv(log.getTargetTenant() != null ? log.getTargetTenant().getBusinessName() : "")).append(",");
            csv.append(escapeCsv(log.getModule())).append(",");
            csv.append(log.getResult()).append(",");
            csv.append(escapeCsv(log.getIpAddress())).append("\n");
        }

        return csv.toString();
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    private AuditLogResponse toAuditResponse(AdminAuditLog log) {
        return AuditLogResponse.builder()
                .id(log.getId())
                .timestamp(log.getTimestamp())
                .adminUserId(log.getAdminUser() != null ? log.getAdminUser().getId() : null)
                .adminEmail(log.getAdminEmail())
                .adminRole(log.getAdminRole())
                .category(log.getCategory())
                .action(log.getAction())
                .description(log.getDescription())
                .targetTenantId(log.getTargetTenant() != null ? log.getTargetTenant().getId() : null)
                .targetTenantName(log.getTargetTenant() != null ? log.getTargetTenant().getBusinessName() : null)
                .module(log.getModule())
                .entityType(log.getEntityType())
                .entityId(log.getEntityId())
                .ipAddress(log.getIpAddress())
                .result(log.getResult())
                .build();
    }

    private SecurityAlertResponse toAlertResponse(SecurityAlert alert) {
        return SecurityAlertResponse.builder()
                .id(alert.getId())
                .ruleCode(alert.getRuleCode())
                .triggeredAt(alert.getTriggeredAt())
                .adminUserId(alert.getAdminUser() != null ? alert.getAdminUser().getId() : null)
                .adminEmail(alert.getAdminUser() != null ? alert.getAdminUser().getEmail() : null)
                .tenantId(alert.getTenant() != null ? alert.getTenant().getId() : null)
                .tenantName(alert.getTenant() != null ? alert.getTenant().getBusinessName() : null)
                .description(alert.getDescription())
                .status(alert.getStatus())
                .build();
    }
}
