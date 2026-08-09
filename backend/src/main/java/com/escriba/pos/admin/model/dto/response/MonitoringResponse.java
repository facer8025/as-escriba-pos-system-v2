package com.escriba.pos.admin.model.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class MonitoringResponse {
    private List<ServiceHealthDTO> services;
    private SystemMetricsDTO metrics;
    private List<String> recentErrors;
}

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ServiceHealthDTO {
    private String serviceName;
    private String status;       // UP, DEGRADED, DOWN
    private double uptime30d;    // percentage
    private int responseTimeMs;
    private String lastIncident;
    private LocalDateTime lastCheck;
}

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class SystemMetricsDTO {
    private long totalTenants;
    private long activeTenants;
    private long totalLicenses;
    private long activeLicenses;
    private long ticketsOpen;
    private long invoicesToday;
    private long storageUsedMb;
    private long apiRequestsToday;
}
