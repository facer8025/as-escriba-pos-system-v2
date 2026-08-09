package com.escriba.pos.admin.model.dto.response;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
public class DashboardKpiResponse {
    private long activeCompanies;
    private long trialCompanies;
    private long suspendedCompanies;
    private BigDecimal mrr;
    private BigDecimal arr;
    private long newContractsMonth;
    private long licensesExpiring30d;
    private long openTickets;
    private List<ServiceHealthResponse> services;
    private List<RecentActivityResponse> recentActivity;
}
