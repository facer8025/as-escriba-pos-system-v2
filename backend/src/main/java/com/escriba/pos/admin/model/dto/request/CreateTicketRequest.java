package com.escriba.pos.admin.model.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class CreateTicketRequest {
    private UUID tenantId;
    private String subject;
    private String category;
    private String priority;
    private String body;
}
