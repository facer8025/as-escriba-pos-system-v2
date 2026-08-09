package com.escriba.pos.admin.model.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class TicketResponse {
    private UUID id;
    private String ticketNumber;
    private UUID tenantId;
    private String tenantName;
    private String subject;
    private String category;
    private String priority;
    private String status;
    private UUID assignedTo;
    private String assignedToName;
    private LocalDateTime slaDeadline;
    private Boolean slaBreached;
    private String createdByType;
    private UUID createdById;
    private LocalDateTime closedAt;
    private String resolutionSummary;
    private String rootCause;
    private Short satisfactionScore;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private long messageCount;
    private String lastMessage;
}
