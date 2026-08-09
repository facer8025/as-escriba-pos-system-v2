package com.escriba.pos.admin.model.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class TicketStatsResponse {
    private long openTickets;
    private long inProgressTickets;
    private long waitingCustomerTickets;
    private long closedToday;
    private long slaBreached;
    private double avgResolutionHours;
    private long criticalOpen;
    private long highOpen;
}
