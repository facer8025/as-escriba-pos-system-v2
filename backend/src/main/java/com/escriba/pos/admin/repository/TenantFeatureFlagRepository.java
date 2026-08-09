package com.escriba.pos.admin.repository;

import com.escriba.pos.admin.model.entity.TenantFeatureFlag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantFeatureFlagRepository extends JpaRepository<TenantFeatureFlag, UUID> {
    List<TenantFeatureFlag> findByTenantId(UUID tenantId);
    Optional<TenantFeatureFlag> findByTenantIdAndFlagCode(UUID tenantId, String flagCode);
    boolean existsByTenantIdAndFlagCode(UUID tenantId, String flagCode);
    void deleteByTenantIdAndFlagCode(UUID tenantId, String flagCode);
    void deleteByTenantId(UUID tenantId);
}
