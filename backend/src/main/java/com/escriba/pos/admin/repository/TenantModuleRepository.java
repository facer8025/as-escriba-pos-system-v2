package com.escriba.pos.admin.repository;

import com.escriba.pos.admin.model.entity.TenantModule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface TenantModuleRepository extends JpaRepository<TenantModule, UUID> {
    List<TenantModule> findByTenantId(UUID tenantId);
    void deleteByTenantId(UUID tenantId);
}
