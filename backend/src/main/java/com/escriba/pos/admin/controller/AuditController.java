package com.escriba.pos.admin.controller;

import com.escriba.pos.admin.model.dto.response.AuditLogResponse;
import com.escriba.pos.admin.model.dto.response.SecurityAlertResponse;
import com.escriba.pos.admin.service.AuditService;
import com.escriba.pos.dto.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/audit")
@RequiredArgsConstructor
public class AuditController {

    private final AuditService auditService;

    @GetMapping("/logs")
    public ResponseEntity<ApiResponse<Page<AuditLogResponse>>> listAuditLogs(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String result,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                auditService.listAuditLogs(category, action, result, fromDate, toDate, page, size)));
    }

    @GetMapping("/logs/{id}")
    public ResponseEntity<ApiResponse<AuditLogResponse>> getAuditLog(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(auditService.getAuditLog(id)));
    }

    @GetMapping("/alerts")
    public ResponseEntity<ApiResponse<Page<SecurityAlertResponse>>> listAlerts(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {
        return ResponseEntity.ok(ApiResponse.success(auditService.listSecurityAlerts(status, page, size)));
    }

    @GetMapping("/alerts/count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> countNewAlerts() {
        return ResponseEntity.ok(ApiResponse.success(Map.of("newAlerts", auditService.countNewAlerts())));
    }

    @GetMapping("/logs/export/csv")
    public ResponseEntity<byte[]> exportCsv(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String result,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate) {

        String csv = auditService.exportToCsv(category, action, result, fromDate, toDate);
        byte[] bytes = csv.getBytes(StandardCharsets.UTF_8);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        headers.set(HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=audit-logs-" + LocalDateTime.now().toLocalDate() + ".csv");
        headers.set(HttpHeaders.CONTENT_TYPE, "text/csv; charset=UTF-8");

        return ResponseEntity.ok().headers(headers).body(bytes);
    }
}
