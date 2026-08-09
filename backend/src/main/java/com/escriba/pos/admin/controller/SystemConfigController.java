package com.escriba.pos.admin.controller;

import com.escriba.pos.admin.model.entity.AdminUser;
import com.escriba.pos.admin.model.entity.DianProvider;
import com.escriba.pos.admin.model.entity.MaintenanceWindow;
import com.escriba.pos.admin.model.entity.PaymentGateway;
import com.escriba.pos.admin.service.SystemConfigService;
import com.escriba.pos.dto.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/admin/config")
@RequiredArgsConstructor
public class SystemConfigController {

    private final SystemConfigService systemConfigService;

    @GetMapping("/system")
    public ResponseEntity<ApiResponse<Map<String, String>>> getSystemConfig() {
        return ResponseEntity.ok(ApiResponse.success(systemConfigService.getSystemConfig()));
    }

    @PutMapping("/system")
    public ResponseEntity<ApiResponse<Void>> updateSystemConfig(
            @RequestBody Map<String, String> configs,
            @AuthenticationPrincipal AdminUser currentUser) {
        systemConfigService.updateSystemConfig(configs, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Configuración actualizada", null));
    }

    @GetMapping("/dian-providers")
    public ResponseEntity<ApiResponse<List<DianProvider>>> getDianProviders() {
        return ResponseEntity.ok(ApiResponse.success(systemConfigService.getDianProviders()));
    }

    @PostMapping("/dian-providers")
    public ResponseEntity<ApiResponse<DianProvider>> saveDianProvider(@RequestBody DianProvider provider) {
        return ResponseEntity.ok(
                ApiResponse.success("Proveedor DIAN guardado", systemConfigService.saveDianProvider(provider)));
    }

    @GetMapping("/payment-gateways")
    public ResponseEntity<ApiResponse<List<PaymentGateway>>> getPaymentGateways() {
        return ResponseEntity.ok(ApiResponse.success(systemConfigService.getPaymentGateways()));
    }

    @PostMapping("/payment-gateways")
    public ResponseEntity<ApiResponse<PaymentGateway>> savePaymentGateway(@RequestBody PaymentGateway gateway) {
        return ResponseEntity.ok(
                ApiResponse.success("Pasarela de pago guardada", systemConfigService.savePaymentGateway(gateway)));
    }

    @GetMapping("/maintenance-windows")
    public ResponseEntity<ApiResponse<List<MaintenanceWindow>>> getMaintenanceWindows() {
        return ResponseEntity.ok(ApiResponse.success(systemConfigService.getMaintenanceWindows()));
    }

    @PostMapping("/maintenance-windows")
    public ResponseEntity<ApiResponse<MaintenanceWindow>> createMaintenanceWindow(
            @RequestBody MaintenanceWindow window,
            @AuthenticationPrincipal AdminUser currentUser) {
        return ResponseEntity.ok(ApiResponse.success("Ventana de mantenimiento creada",
                systemConfigService.createMaintenanceWindow(window, currentUser)));
    }

    @PostMapping("/maintenance-windows/{id}/cancel")
    public ResponseEntity<ApiResponse<Void>> cancelMaintenanceWindow(@PathVariable UUID id) {
        systemConfigService.cancelMaintenanceWindow(id);
        return ResponseEntity.ok(ApiResponse.success("Ventana de mantenimiento cancelada", null));
    }
}
