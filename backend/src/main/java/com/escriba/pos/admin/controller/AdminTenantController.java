package com.escriba.pos.admin.controller;

import com.escriba.pos.admin.model.dto.request.CreateTenantRequest;
import com.escriba.pos.admin.model.dto.response.TenantResponse;
import com.escriba.pos.admin.model.entity.AdminUser;
import com.escriba.pos.admin.security.AdminJwtTokenProvider;
import com.escriba.pos.admin.service.TenantService;
import com.escriba.pos.dto.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/admin/tenants")
@RequiredArgsConstructor
public class AdminTenantController {

    private final TenantService tenantService;
    private final AdminJwtTokenProvider tokenProvider;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<TenantResponse>>> listTenants(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                tenantService.listTenants(search, status, page, size)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TenantResponse>> getTenant(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(tenantService.getTenant(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TenantResponse>> createTenant(
            @Valid @RequestBody CreateTenantRequest request,
            @AuthenticationPrincipal AdminUser currentUser) {
        return ResponseEntity.ok(ApiResponse.success(
                tenantService.createTenant(request, currentUser)));
    }

    @PostMapping("/{id}/impersonate")
    public ResponseEntity<ApiResponse<Map<String, String>>> impersonate(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal AdminUser currentUser) {
        String reason = body.getOrDefault("reason", "Acceso administrativo");
        String token = tenantService.generateImpersonationToken(id, currentUser, reason);
        Map<String, String> result = new HashMap<>();
        result.put("token", token);
        result.put("tenantUrl", "/app/impersonate?token=" + token);
        result.put("expiresIn", "2h");
        return ResponseEntity.ok(
                ApiResponse.success("Token de impersonación generado", result));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<TenantResponse>> updateStatus(
            @PathVariable UUID id,
            @RequestParam String status,
            @RequestParam(required = false) String reason) {
        return ResponseEntity.ok(ApiResponse.success(
                tenantService.updateTenantStatus(id, status, reason)));
    }

    private AdminUser findAdminUser(Authentication auth) {
        if (auth != null && auth.getPrincipal() instanceof AdminUser) {
            return (AdminUser) auth.getPrincipal();
        }
        return null;
    }
}
