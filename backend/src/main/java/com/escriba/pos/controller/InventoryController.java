package com.escriba.pos.controller;

import com.escriba.pos.dto.response.ApiResponse;
import com.escriba.pos.model.entity.InventoryMovement;
import com.escriba.pos.model.entity.Warehouse;
import com.escriba.pos.repository.InventoryMovementRepository;
import com.escriba.pos.repository.WarehouseRepository;
import com.escriba.pos.service.InventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;
    private final InventoryMovementRepository movementRepository;
    private final WarehouseRepository warehouseRepository;

    // ========== WAREHOUSES ==========

    @GetMapping("/warehouses")
    public ResponseEntity<ApiResponse<List<Warehouse>>> getWarehouses(
            @RequestParam UUID companyId) {
        return ResponseEntity.ok(ApiResponse.success(
                warehouseRepository.findByBranchCompanyId(companyId)));
    }

    // ========== SUMMARY ==========

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSummary(
            @RequestParam UUID companyId) {
        return ResponseEntity.ok(ApiResponse.success(
                inventoryService.getSummary(companyId)));
    }

    // ========== MOVEMENTS (KARDEX) ==========

    @GetMapping("/movements")
    public ResponseEntity<ApiResponse<Page<InventoryMovement>>> getMovements(
            @RequestParam UUID productId,
            @RequestParam(required = false) LocalDateTime dateFrom,
            @RequestParam(required = false) LocalDateTime dateTo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {

        Page<InventoryMovement> movements = movementRepository.findByProductId(
                productId, dateFrom, dateTo,
                PageRequest.of(page, size, Sort.by("createdAt").descending()));

        return ResponseEntity.ok(ApiResponse.success(movements));
    }

    @GetMapping("/kardex/{productId}")
    public ResponseEntity<ApiResponse<List<InventoryMovement>>> getKardex(
            @PathVariable UUID productId,
            @RequestParam(required = false) LocalDateTime dateFrom,
            @RequestParam(required = false) LocalDateTime dateTo) {

        return ResponseEntity.ok(ApiResponse.success(
                inventoryService.getKardex(productId, dateFrom, dateTo)));
    }

    // ========== ENTRIES ==========

    @PostMapping("/entries")
    @PreAuthorize("hasAnyRole('AD', 'BO')")
    public ResponseEntity<ApiResponse<InventoryMovement>> registerEntry(
            @RequestParam UUID companyId,
            @RequestParam UUID productId,
            @RequestParam UUID warehouseId,
            @RequestParam BigDecimal quantity,
            @RequestParam BigDecimal unitCost,
            @RequestParam(required = false) String referenceType,
            @RequestParam(required = false) String notes,
            @RequestParam UUID userId) {

        InventoryMovement movement = inventoryService.registerEntry(
                companyId, productId, warehouseId, quantity, unitCost,
                referenceType, notes, userId);

        return ResponseEntity.ok(ApiResponse.success("Entrada registrada exitosamente", movement));
    }

    // ========== EXITS ==========

    @PostMapping("/exits")
    @PreAuthorize("hasAnyRole('AD', 'BO')")
    public ResponseEntity<ApiResponse<InventoryMovement>> registerExit(
            @RequestParam UUID companyId,
            @RequestParam UUID productId,
            @RequestParam UUID warehouseId,
            @RequestParam BigDecimal quantity,
            @RequestParam(required = false) String reason,
            @RequestParam(required = false) String notes,
            @RequestParam UUID userId) {

        InventoryMovement movement = inventoryService.registerExit(
                companyId, productId, warehouseId, quantity, reason, notes, userId);

        return ResponseEntity.ok(ApiResponse.success("Salida registrada exitosamente", movement));
    }

    // ========== QUICK ADJUSTMENT ==========

    @PostMapping("/adjustments")
    @PreAuthorize("hasAnyRole('AD', 'BO')")
    public ResponseEntity<ApiResponse<InventoryMovement>> quickAdjustment(
            @RequestParam UUID companyId,
            @RequestParam UUID productId,
            @RequestParam UUID warehouseId,
            @RequestParam String adjustmentType,
            @RequestParam BigDecimal quantity,
            @RequestParam(required = false) String reason,
            @RequestParam(required = false) String notes,
            @RequestParam UUID userId) {

        InventoryMovement movement = inventoryService.quickAdjustment(
                companyId, productId, warehouseId, adjustmentType, quantity,
                reason, notes, userId);

        return ResponseEntity.ok(ApiResponse.success("Ajuste aplicado exitosamente", movement));
    }
}
