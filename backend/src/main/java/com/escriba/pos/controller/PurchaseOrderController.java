package com.escriba.pos.controller;

import com.escriba.pos.dto.response.ApiResponse;
import com.escriba.pos.model.entity.PurchaseOrder;
import com.escriba.pos.model.enums.OrderStatus;
import com.escriba.pos.repository.PurchaseOrderRepository;
import com.escriba.pos.service.PurchaseOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/purchase-orders")
@RequiredArgsConstructor
public class PurchaseOrderController {

    private final PurchaseOrderService purchaseOrderService;
    private final PurchaseOrderRepository purchaseOrderRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('AD', 'BO')")
    public ResponseEntity<ApiResponse<Page<PurchaseOrder>>> getAll(
            @RequestParam UUID companyId,
            @RequestParam(required = false) UUID supplierId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) LocalDateTime dateFrom,
            @RequestParam(required = false) LocalDateTime dateTo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {

        Page<PurchaseOrder> orders = purchaseOrderRepository.findByFilters(
                companyId, supplierId, status,
                PageRequest.of(page, size, Sort.by("orderDate").descending()));

        return ResponseEntity.ok(ApiResponse.success(orders));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PurchaseOrder>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(
                purchaseOrderRepository.findById(id).orElse(null)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('AD', 'BO')")
    public ResponseEntity<ApiResponse<PurchaseOrder>> create(@RequestBody PurchaseOrder order) {
        PurchaseOrder saved = purchaseOrderService.createOrder(order);
        return ResponseEntity.ok(ApiResponse.success("Orden creada exitosamente", saved));
    }

    @PostMapping("/{id}/send")
    @PreAuthorize("hasAnyRole('AD', 'BO')")
    public ResponseEntity<ApiResponse<PurchaseOrder>> send(@PathVariable UUID id, @RequestParam UUID userId) {
        PurchaseOrder order = purchaseOrderService.sendOrder(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Orden enviada al proveedor", order));
    }

    @PostMapping("/{id}/receive")
    @PreAuthorize("hasAnyRole('AD', 'BO')")
    public ResponseEntity<ApiResponse<PurchaseOrder>> receive(
            @PathVariable UUID id,
            @RequestParam UUID userId,
            @RequestParam UUID warehouseId) {
        PurchaseOrder order = purchaseOrderService.receiveOrder(id, userId, warehouseId);
        return ResponseEntity.ok(ApiResponse.success("Mercancía recibida exitosamente", order));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('AD', 'BO')")
    public ResponseEntity<ApiResponse<PurchaseOrder>> cancel(@PathVariable UUID id) {
        PurchaseOrder order = purchaseOrderService.cancelOrder(id);
        return ResponseEntity.ok(ApiResponse.success("Orden cancelada", order));
    }

    @PostMapping("/{id}/advance")
    @PreAuthorize("hasAnyRole('AD', 'BO')")
    public ResponseEntity<ApiResponse<PurchaseOrder>> advanceStatus(
            @PathVariable UUID id,
            @RequestParam OrderStatus status) {
        PurchaseOrder order = purchaseOrderService.advanceStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success("Estado actualizado a " + status, order));
    }
}
