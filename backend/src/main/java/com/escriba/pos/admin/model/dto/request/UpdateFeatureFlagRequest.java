package com.escriba.pos.admin.model.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class UpdateFeatureFlagRequest {
    private String description;
    private String defaultState; // ACTIVE_FOR_ALL, SPECIFIC_COMPANIES, INACTIVE
    private BigDecimal rolloutPct;
}
