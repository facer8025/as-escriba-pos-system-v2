package com.escriba.pos.admin.service;

import com.escriba.pos.admin.model.dto.response.SystemConfigResponse;
import com.escriba.pos.admin.model.entity.AdminUser;
import com.escriba.pos.admin.model.entity.DianProvider;
import com.escriba.pos.admin.model.entity.MaintenanceWindow;
import com.escriba.pos.admin.model.entity.PaymentGateway;
import com.escriba.pos.admin.model.entity.SystemConfig;
import com.escriba.pos.admin.repository.DianProviderRepository;
import com.escriba.pos.admin.repository.MaintenanceWindowRepository;
import com.escriba.pos.admin.repository.PaymentGatewayRepository;
import com.escriba.pos.admin.repository.SystemConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SystemConfigService {

    private final SystemConfigRepository configRepository;
    private final DianProviderRepository dianProviderRepository;
    private final PaymentGatewayRepository paymentGatewayRepository;
    private final MaintenanceWindowRepository maintenanceWindowRepository;

    // ── System Config ────────────────────────────────────────────

    public Map<String, String> getSystemConfig() {
        return configRepository.findAll().stream()
                .collect(Collectors.toMap(SystemConfig::getConfigKey, SystemConfig::getConfigValue));
    }

    @Transactional
    public void updateSystemConfig(Map<String, String> configs, AdminUser updatedBy) {
        for (Map.Entry<String, String> entry : configs.entrySet()) {
            SystemConfig config = configRepository.findByConfigKey(entry.getKey())
                    .orElse(SystemConfig.builder()
                            .configKey(entry.getKey())
                            .configValue(entry.getValue())
                            .configType("TEXT")
                            .build());
            config.setConfigValue(entry.getValue());
            config.setUpdatedBy(updatedBy);
            configRepository.save(config);
        }
    }

    // ── DIAN Providers ───────────────────────────────────────────

    public List<DianProvider> getDianProviders() {
        return dianProviderRepository.findAll();
    }

    @Transactional
    public DianProvider saveDianProvider(DianProvider provider) {
        return dianProviderRepository.save(provider);
    }

    // ── Payment Gateways ─────────────────────────────────────────

    public List<PaymentGateway> getPaymentGateways() {
        return paymentGatewayRepository.findAll();
    }

    @Transactional
    public PaymentGateway savePaymentGateway(PaymentGateway gateway) {
        return paymentGatewayRepository.save(gateway);
    }

    // ── Maintenance Windows ────────────────────────────────────────

        @Transactional(readOnly = true)
    public List<MaintenanceWindow> getMaintenanceWindows() {
        return maintenanceWindowRepository.findByStartsAtAfterOrderByStartsAtAsc(
                java.time.LocalDateTime.now());
    }

    @Transactional
    public MaintenanceWindow createMaintenanceWindow(MaintenanceWindow window, AdminUser createdBy) {
        window.setCreatedBy(createdBy);
        return maintenanceWindowRepository.save(window);
    }

    @Transactional
    public void cancelMaintenanceWindow(UUID id) {
        maintenanceWindowRepository.findById(id).ifPresent(w -> {
            w.setStatus("CANCELLED");
            maintenanceWindowRepository.save(w);
        });
    }
}
