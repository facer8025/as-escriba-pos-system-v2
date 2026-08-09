package com.escriba.pos.admin.model.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class AuditLogResponse {
    private Long id;
    private LocalDateTime timestamp;
    private UUID adminUserId;
    private String adminEmail;
    private String adminRole;
    private String category;
    private String action;
    private String description;
    private UUID targetTenantId;
    private String targetTenantName;
    private String module;
    private String entityType;
    private String entityId;
    private String ipAddress;
    private String result;
}
