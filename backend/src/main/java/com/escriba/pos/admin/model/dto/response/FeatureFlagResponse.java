package com.escriba.pos.admin.model.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class FeatureFlagResponse {
    private UUID id;
    private String code;
    private String description;
    private String defaultState;
    private BigDecimal rolloutPct;
}
