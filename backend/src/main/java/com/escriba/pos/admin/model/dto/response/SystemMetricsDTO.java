package com.escriba.pos.admin.model.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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
