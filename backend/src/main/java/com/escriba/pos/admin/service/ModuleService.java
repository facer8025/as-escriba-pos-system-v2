package com.escriba.pos.admin.service;

import com.escriba.pos.admin.model.entity.Module;
import com.escriba.pos.admin.model.entity.TenantModule;
import com.escriba.pos.admin.repository.ModuleRepository;
import com.escriba.pos.admin.repository.TenantModuleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ModuleService {

    private final ModuleRepository moduleRepository;
    private final TenantModuleRepository tenantModuleRepository;

    public List<Module> listModules() {
        return moduleRepository.findByActiveTrueOrderBySortOrderAsc();
    }

    public List<TenantModule> getTenantModules(UUID tenantId) {
        return tenantModuleRepository.findByTenantId(tenantId);
    }

    @Transactional
    public void updateTenantModules(UUID tenantId, List<String> moduleCodes) {
        tenantModuleRepository.deleteByTenantId(tenantId);
        for (String code : moduleCodes) {
            TenantModule tm = TenantModule.builder()
                    .tenant(com.escriba.pos.admin.model.entity.Tenant.builder().id(tenantId).build())
                    .moduleCode(code)
                    .isEnabled(true)
                    .build();
            tenantModuleRepository.save(tm);
        }
    }
}
