package com.escriba.pos.controller;

import com.escriba.pos.dto.response.ApiResponse;
import com.escriba.pos.model.entity.Notification;
import com.escriba.pos.model.entity.NotificationConfig;
import com.escriba.pos.repository.NotificationConfigRepository;
import com.escriba.pos.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationConfigRepository configRepository;
    private final NotificationRepository notificationRepository;

    // ========== CONFIGURACION ==========

    @GetMapping("/config")
    public ResponseEntity<ApiResponse<List<NotificationConfig>>> getConfig(
            @RequestParam UUID companyId) {
        return ResponseEntity.ok(ApiResponse.success(
                configRepository.findByCompanyIdOrderByNotificationType(companyId)));
    }

    @PutMapping("/config")
    @Transactional
    public ResponseEntity<ApiResponse<NotificationConfig>> updateConfig(
            @RequestBody Map<String, Object> body) {
        UUID companyId = UUID.fromString(body.get("companyId").toString());
        String notificationType = (String) body.get("notificationType");

        NotificationConfig config = configRepository
                .findByCompanyIdAndNotificationType(companyId, notificationType)
                .orElse(null);

        if (config == null) {
            return ResponseEntity.ok(ApiResponse.error("Configuracion no encontrada para: " + notificationType));
        }

        if (body.containsKey("emailEnabled")) config.setEmailEnabled((Boolean) body.get("emailEnabled"));
        if (body.containsKey("inAppEnabled")) config.setInAppEnabled((Boolean) body.get("inAppEnabled"));
        if (body.containsKey("pushEnabled")) config.setPushEnabled((Boolean) body.get("pushEnabled"));
        if (body.containsKey("recipients")) {
            Object rec = body.get("recipients");
            if (rec instanceof List) {
                config.setRecipients((List<String>) rec);
            } else if (rec instanceof String && !((String) rec).isEmpty()) {
                config.setRecipients(java.util.Arrays.asList(((String) rec).split(",")));
            }
        }

        configRepository.save(config);
        return ResponseEntity.ok(ApiResponse.success("Configuracion actualizada", config));
    }

    // ========== IN-APP NOTIFICATIONS ==========

    @GetMapping
    public ResponseEntity<ApiResponse<Page<Notification>>> getNotifications(
            @RequestParam UUID companyId,
            @RequestParam(required = false) UUID userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {

        Page<Notification> notifications = notificationRepository.findByFilters(
                companyId, userId,
                PageRequest.of(page, size, Sort.by("createdAt").descending()));

        return ResponseEntity.ok(ApiResponse.success(notifications));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUnreadCount(
            @RequestParam UUID companyId,
            @RequestParam UUID userId) {

        long count = notificationRepository.countByCompanyIdAndUserIdAndIsReadFalse(companyId, userId);
        Map<String, Object> result = new HashMap<>();
        result.put("count", count);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping("/{id}/read")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable UUID id) {
        notificationRepository.markAsRead(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/read-all")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(
            @RequestParam UUID companyId,
            @RequestParam UUID userId) {
        notificationRepository.markAllAsRead(companyId, userId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
