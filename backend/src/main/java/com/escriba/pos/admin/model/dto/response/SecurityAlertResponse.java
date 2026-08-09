package com.escriba.pos.admin.model.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class SecurityAlertResponse {
    private UUID id;
    private String ruleCode;
    private LocalDateTime triggeredAt;
    private UUID adminUserId;
    private String adminEmail;
    private UUID tenantId;
    private String tenantName;
    private String description;
    private String status;
}
