package com.escriba.pos.admin.controller;

import com.escriba.pos.admin.model.dto.request.CreateLicenseRequest;
import com.escriba.pos.admin.model.dto.response.LicenseResponse;
import com.escriba.pos.admin.service.LicenseService;
import com.escriba.pos.dto.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/admin/licenses")
@RequiredArgsConstructor
public class AdminLicenseController {

    private final LicenseService licenseService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<LicenseResponse>>> listLicenses(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                licenseService.listLicenses(status, page, size)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<LicenseResponse>> getLicense(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(licenseService.getLicense(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<LicenseResponse>> createLicense(
            @Valid @RequestBody CreateLicenseRequest request) {
        return ResponseEntity.ok(ApiResponse.success(licenseService.createLicense(request, null)));
    }

    @PostMapping("/{id}/renew")
    public ResponseEntity<ApiResponse<LicenseResponse>> renewLicense(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(licenseService.renewLicense(id)));
    }

    @PostMapping("/{id}/change-plan")
    public ResponseEntity<ApiResponse<LicenseResponse>> changePlan(
            @PathVariable UUID id, @RequestParam Integer planId) {
        return ResponseEntity.ok(ApiResponse.success(licenseService.changePlan(id, planId)));
    }

    @PostMapping("/{id}/status")
    public ResponseEntity<ApiResponse<LicenseResponse>> updateStatus(
            @PathVariable UUID id, @RequestParam String status) {
        return ResponseEntity.ok(ApiResponse.success(licenseService.updateStatus(id, status)));
    }
}
