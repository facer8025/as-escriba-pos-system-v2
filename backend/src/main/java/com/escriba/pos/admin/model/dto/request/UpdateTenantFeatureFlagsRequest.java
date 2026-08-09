package com.escriba.pos.admin.model.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class UpdateTenantFeatureFlagsRequest {
    private List<String> enabledFlags;
}
