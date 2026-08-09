package com.escriba.pos.admin.model.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class ServiceHealthResponse {
    private String serviceName;
    private String status;
    private double uptime30d;
    private String lastIncident;
}
