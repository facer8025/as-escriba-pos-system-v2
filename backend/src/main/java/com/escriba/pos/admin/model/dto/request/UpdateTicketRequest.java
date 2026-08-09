package com.escriba.pos.admin.model.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class UpdateTicketRequest {
    private String subject;
    private String category;
    private String priority;
    private String status;
    private UUID assignedTo;
    private String resolutionSummary;
    private String rootCause;
}
