package com.escriba.pos.admin.controller;

import com.escriba.pos.admin.model.dto.request.CreateFeatureFlagRequest;
import com.escriba.pos.admin.model.dto.request.UpdateFeatureFlagRequest;
import com.escriba.pos.admin.model.dto.request.UpdateTenantFeatureFlagsRequest;
import com.escriba.pos.admin.model.dto.response.FeatureFlagResponse;
import com.escriba.pos.admin.model.dto.response.TenantFeatureFlagResponse;
import com.escriba.pos.admin.model.entity.AdminUser;
import com.escriba.pos.admin.service.FeatureFlagService;
import com.escriba.pos.dto.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/admin/feature-flags")
@RequiredArgsConstructor
public class FeatureFlagController {

    private final FeatureFlagService featureFlagService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<FeatureFlagResponse>>> listFeatureFlags() {
        return ResponseEntity.ok(ApiResponse.success(featureFlagService.listFeatureFlags()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<FeatureFlagResponse>> getFeatureFlag(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(featureFlagService.getFeatureFlag(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<FeatureFlagResponse>> createFeatureFlag(
            @RequestBody CreateFeatureFlagRequest request,
            @AuthenticationPrincipal AdminUser currentUser) {
        return ResponseEntity.ok(
                ApiResponse.success("Feature flag creado", featureFlagService.createFeatureFlag(request, currentUser)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<FeatureFlagResponse>> updateFeatureFlag(
            @PathVariable UUID id,
            @RequestBody UpdateFeatureFlagRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success("Feature flag actualizado", featureFlagService.updateFeatureFlag(id, request)));
    }

    @GetMapping("/by-company/{tenantId}")
    public ResponseEntity<ApiResponse<List<TenantFeatureFlagResponse>>> getTenantFeatureFlags(
            @PathVariable UUID tenantId) {
        return ResponseEntity.ok(ApiResponse.success(featureFlagService.getTenantFeatureFlags(tenantId)));
    }

    @PutMapping("/by-company/{tenantId}")
    public ResponseEntity<ApiResponse<Void>> updateTenantFeatureFlags(
            @PathVariable UUID tenantId,
            @RequestBody UpdateTenantFeatureFlagsRequest request) {
        featureFlagService.updateTenantFeatureFlags(tenantId, request);
        return ResponseEntity.ok(ApiResponse.success("Feature flags actualizados", null));
    }

    @PutMapping("/by-company/{tenantId}/{flagCode}")
    public ResponseEntity<ApiResponse<Void>> setTenantFeatureFlag(
            @PathVariable UUID tenantId,
            @PathVariable String flagCode,
            @RequestParam boolean enabled) {
        featureFlagService.setTenantFeatureFlag(tenantId, flagCode, enabled);
        return ResponseEntity.ok(ApiResponse.success("Feature flag actualizado", null));
    }
}
