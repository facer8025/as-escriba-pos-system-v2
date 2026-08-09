package com.escriba.pos.admin.controller;

import com.escriba.pos.admin.model.dto.response.MonitoringResponse;
import com.escriba.pos.admin.service.MonitoringService;
import com.escriba.pos.dto.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/monitoring")
@RequiredArgsConstructor
public class MonitoringController {

    private final MonitoringService monitoringService;

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<MonitoringResponse>> getDashboard() {
        return ResponseEntity.ok(ApiResponse.success(monitoringService.getDashboard()));
    }
}
