package com.escriba.pos.admin.controller;

import com.escriba.pos.admin.model.entity.Module;
import com.escriba.pos.admin.model.entity.TenantModule;
import com.escriba.pos.admin.service.ModuleService;
import com.escriba.pos.dto.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/admin/modules")
@RequiredArgsConstructor
public class AdminModuleController {

    private final ModuleService moduleService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Module>>> listModules() {
        return ResponseEntity.ok(ApiResponse.success(moduleService.listModules()));
    }

    @GetMapping("/by-company/{tenantId}")
    public ResponseEntity<ApiResponse<List<TenantModule>>> getTenantModules(@PathVariable UUID tenantId) {
        return ResponseEntity.ok(ApiResponse.success(moduleService.getTenantModules(tenantId)));
    }

    @PutMapping("/by-company/{tenantId}")
    public ResponseEntity<ApiResponse<Void>> updateTenantModules(
            @PathVariable UUID tenantId,
            @RequestBody List<String> moduleCodes) {
        moduleService.updateTenantModules(tenantId, moduleCodes);
        return ResponseEntity.ok(ApiResponse.success("Módulos actualizados", null));
    }
}
