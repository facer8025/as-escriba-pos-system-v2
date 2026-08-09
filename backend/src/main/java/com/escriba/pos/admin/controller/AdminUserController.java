package com.escriba.pos.admin.controller;

import com.escriba.pos.admin.model.dto.request.CreateAdminUserRequest;
import com.escriba.pos.admin.model.dto.request.UpdateAdminUserRequest;
import com.escriba.pos.admin.model.dto.response.AdminUserResponse;
import com.escriba.pos.admin.model.entity.AdminUser;
import com.escriba.pos.admin.service.AdminUserService;
import com.escriba.pos.dto.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/admin/admin-users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AdminUserResponse>>> listAdminUsers() {
        return ResponseEntity.ok(ApiResponse.success(adminUserService.listAdminUsers()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminUserResponse>> getAdminUser(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(adminUserService.getAdminUser(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AdminUserResponse>> createAdminUser(
            @RequestBody CreateAdminUserRequest request,
            @AuthenticationPrincipal AdminUser currentUser) {
        return ResponseEntity.ok(
                ApiResponse.success("Usuario admin creado", adminUserService.createAdminUser(request, currentUser)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminUserResponse>> updateAdminUser(
            @PathVariable UUID id,
            @RequestBody UpdateAdminUserRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success("Usuario admin actualizado", adminUserService.updateAdminUser(id, request)));
    }

    @PostMapping("/{id}/toggle-block")
    public ResponseEntity<ApiResponse<AdminUserResponse>> toggleBlock(@PathVariable UUID id) {
        return ResponseEntity.ok(
                ApiResponse.success("Estado cambiado", adminUserService.toggleBlockUser(id)));
    }
}
