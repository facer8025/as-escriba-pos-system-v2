package com.escriba.pos.admin.controller;

import com.escriba.pos.admin.model.dto.request.CreatePlanRequest;
import com.escriba.pos.admin.model.dto.response.PlanResponse;
import com.escriba.pos.admin.service.PlanService;
import com.escriba.pos.dto.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/plans")
@RequiredArgsConstructor
public class AdminPlanController {

    private final PlanService planService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PlanResponse>>> listPlans(
            @RequestParam(required = false) String status) {
        if (status != null && !status.isBlank()) {
            return ResponseEntity.ok(ApiResponse.success(planService.listPlansByStatus(status)));
        }
        return ResponseEntity.ok(ApiResponse.success(planService.listActivePlans()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PlanResponse>> getPlan(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.success(planService.getPlan(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PlanResponse>> createPlan(
            @Valid @RequestBody CreatePlanRequest request) {
        return ResponseEntity.ok(ApiResponse.success(planService.createPlan(request, null)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PlanResponse>> updatePlan(
            @PathVariable Integer id,
            @Valid @RequestBody CreatePlanRequest request) {
        return ResponseEntity.ok(ApiResponse.success(planService.updatePlan(id, request)));
    }

    @PatchMapping("/{id}/archive")
    public ResponseEntity<ApiResponse<PlanResponse>> archivePlan(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.success(planService.archivePlan(id)));
    }
}
