package com.escriba.pos.admin.service;

import com.escriba.pos.admin.model.dto.request.CreateFeatureFlagRequest;
import com.escriba.pos.admin.model.dto.request.UpdateFeatureFlagRequest;
import com.escriba.pos.admin.model.dto.request.UpdateTenantFeatureFlagsRequest;
import com.escriba.pos.admin.model.dto.response.FeatureFlagResponse;
import com.escriba.pos.admin.model.dto.response.TenantFeatureFlagResponse;
import com.escriba.pos.admin.model.entity.AdminUser;
import com.escriba.pos.admin.model.entity.FeatureFlag;
import com.escriba.pos.admin.model.entity.Tenant;
import com.escriba.pos.admin.model.entity.TenantFeatureFlag;
import com.escriba.pos.admin.repository.FeatureFlagRepository;
import com.escriba.pos.admin.repository.TenantFeatureFlagRepository;
import com.escriba.pos.admin.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FeatureFlagService {

    private final FeatureFlagRepository featureFlagRepository;
    private final TenantFeatureFlagRepository tenantFeatureFlagRepository;
    private final TenantRepository tenantRepository;

    public List<FeatureFlagResponse> listFeatureFlags() {
        return featureFlagRepository.findAll().stream()
                .map(this::toFlagResponse)
                .collect(Collectors.toList());
    }

    public FeatureFlagResponse getFeatureFlag(UUID id) {
        FeatureFlag flag = featureFlagRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Feature flag no encontrado"));
        return toFlagResponse(flag);
    }

    @Transactional
    public FeatureFlagResponse createFeatureFlag(CreateFeatureFlagRequest request, AdminUser createdBy) {
        if (featureFlagRepository.existsByCode(request.getCode())) {
            throw new RuntimeException("Ya existe un feature flag con el código: " + request.getCode());
        }

        FeatureFlag flag = FeatureFlag.builder()
                .code(request.getCode())
                .description(request.getDescription())
                .defaultState(request.getDefaultState() != null ? request.getDefaultState() : "INACTIVE")
                .rolloutPct(request.getRolloutPct())
                .createdBy(createdBy)
                .build();

        flag = featureFlagRepository.save(flag);
        return toFlagResponse(flag);
    }

    @Transactional
    public FeatureFlagResponse updateFeatureFlag(UUID id, UpdateFeatureFlagRequest request) {
        FeatureFlag flag = featureFlagRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Feature flag no encontrado"));

        if (request.getDescription() != null) {
            flag.setDescription(request.getDescription());
        }
        if (request.getDefaultState() != null) {
            flag.setDefaultState(request.getDefaultState());
        }
        if (request.getRolloutPct() != null) {
            flag.setRolloutPct(request.getRolloutPct());
        }

        flag = featureFlagRepository.save(flag);
        return toFlagResponse(flag);
    }

    public List<TenantFeatureFlagResponse> getTenantFeatureFlags(UUID tenantId) {
        if (!tenantRepository.existsById(tenantId)) {
            throw new RuntimeException("Empresa no encontrada");
        }

        List<TenantFeatureFlag> overrides = tenantFeatureFlagRepository.findByTenantId(tenantId);
        return overrides.stream()
                .map(this::toTenantFlagResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void updateTenantFeatureFlags(UUID tenantId, UpdateTenantFeatureFlagsRequest request) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));

        // Validate all flag codes exist
        for (String code : request.getEnabledFlags()) {
            if (!featureFlagRepository.existsByCode(code)) {
                throw new RuntimeException("Feature flag no encontrado: " + code);
            }
        }

        // Remove existing overrides
        tenantFeatureFlagRepository.deleteByTenantId(tenantId);

        // Create new overrides
        for (String code : request.getEnabledFlags()) {
            TenantFeatureFlag tff = TenantFeatureFlag.builder()
                    .tenant(tenant)
                    .flagCode(code)
                    .isEnabled(true)
                    .build();
            tenantFeatureFlagRepository.save(tff);
        }
    }

    @Transactional
    public void setTenantFeatureFlag(UUID tenantId, String flagCode, boolean enabled) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));

        if (!featureFlagRepository.existsByCode(flagCode)) {
            throw new RuntimeException("Feature flag no encontrado: " + flagCode);
        }

        if (enabled) {
            if (!tenantFeatureFlagRepository.existsByTenantIdAndFlagCode(tenantId, flagCode)) {
                TenantFeatureFlag tff = TenantFeatureFlag.builder()
                        .tenant(tenant)
                        .flagCode(flagCode)
                        .isEnabled(true)
                        .build();
                tenantFeatureFlagRepository.save(tff);
            }
        } else {
            tenantFeatureFlagRepository.deleteByTenantIdAndFlagCode(tenantId, flagCode);
        }
    }

    private FeatureFlagResponse toFlagResponse(FeatureFlag flag) {
        return FeatureFlagResponse.builder()
                .id(flag.getId())
                .code(flag.getCode())
                .description(flag.getDescription())
                .defaultState(flag.getDefaultState() != null ? flag.getDefaultState() : "INACTIVE")
                .rolloutPct(flag.getRolloutPct())
                .build();
    }

    private TenantFeatureFlagResponse toTenantFlagResponse(TenantFeatureFlag tff) {
        return TenantFeatureFlagResponse.builder()
                .tenantId(tff.getTenant().getId())
                .flagCode(tff.getFlagCode())
                .isEnabled(tff.getIsEnabled() != null && tff.getIsEnabled())
                .build();
    }
}
