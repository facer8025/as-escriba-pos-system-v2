package com.escriba.pos.admin.controller;

import com.escriba.pos.admin.model.dto.request.AdminLoginRequest;
import com.escriba.pos.admin.model.dto.request.AdminRefreshRequest;
import com.escriba.pos.admin.model.dto.request.AdminTotpVerifyRequest;
import com.escriba.pos.admin.model.dto.response.AdminAuthResponse;
import com.escriba.pos.admin.model.dto.response.AdminUserResponse;
import com.escriba.pos.admin.service.AdminAuthService;
import com.escriba.pos.dto.response.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/admin/auth")
@RequiredArgsConstructor
public class AdminAuthController {

    private final AdminAuthService authService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AdminAuthResponse>> login(
            @Valid @RequestBody AdminLoginRequest request,
            HttpServletRequest httpRequest) {
        AdminAuthResponse response = authService.login(request, httpRequest.getRemoteAddr());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/login/verify-2fa")
    public ResponseEntity<ApiResponse<AdminAuthResponse>> verify2FA(
            @Valid @RequestBody AdminTotpVerifyRequest request) {
        AdminAuthResponse response = authService.verifyTotp(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AdminAuthResponse>> refresh(
            @Valid @RequestBody AdminRefreshRequest request) {
        AdminAuthResponse response = authService.refreshToken(request.getRefreshToken());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @Valid @RequestBody AdminRefreshRequest request) {
        authService.logout(request.getRefreshToken());
        return ResponseEntity.ok(ApiResponse.success("Sesión cerrada", null));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AdminUserResponse>> me(Authentication authentication) {
        UUID userId = (UUID) authentication.getPrincipal();
        AdminUserResponse response = authService.getProfile(userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
