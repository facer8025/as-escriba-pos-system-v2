package com.escriba.pos.admin.model.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ServiceHealthDTO {
    private String serviceName;
    private String status;       // UP, DEGRADED, DOWN
    private double uptime30d;    // percentage
    private int responseTimeMs;
    private String lastIncident;
    private LocalDateTime lastCheck;
}
