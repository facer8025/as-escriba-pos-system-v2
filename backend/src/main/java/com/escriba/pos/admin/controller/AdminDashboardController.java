package com.escriba.pos.admin.controller;

import com.escriba.pos.admin.model.dto.response.DashboardKpiResponse;
import com.escriba.pos.admin.service.DashboardService;
import com.escriba.pos.dto.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/dashboard")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/kpis")
    public ResponseEntity<ApiResponse<DashboardKpiResponse>> getKPIs() {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getKPIs()));
    }
}
