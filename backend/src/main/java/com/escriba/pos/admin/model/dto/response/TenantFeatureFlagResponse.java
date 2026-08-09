package com.escriba.pos.admin.model.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class TenantFeatureFlagResponse {
    private UUID tenantId;
    private String flagCode;
    private Boolean isEnabled;
}
