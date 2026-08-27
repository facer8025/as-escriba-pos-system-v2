package com.escriba.pos.admin.controller;

import com.escriba.pos.admin.model.dto.request.CreateInvoiceRequest;
import com.escriba.pos.admin.model.dto.request.RegisterPaymentRequest;
import com.escriba.pos.admin.model.dto.request.UpdateInvoiceRequest;
import com.escriba.pos.admin.model.dto.response.InvoiceResponse;
import com.escriba.pos.admin.service.InvoiceService;
import com.escriba.pos.dto.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/admin/invoices")
@RequiredArgsConstructor
public class AdminInvoiceController {

    private final InvoiceService invoiceService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<InvoiceResponse>>> listInvoices(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(invoiceService.listInvoices(status, page, size)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<InvoiceResponse>> getInvoice(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(invoiceService.getInvoice(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<InvoiceResponse>> createInvoice(
            @Valid @RequestBody CreateInvoiceRequest request) {
        return ResponseEntity.ok(ApiResponse.success(invoiceService.createInvoice(request, null)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<InvoiceResponse>> updateInvoice(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateInvoiceRequest request) {
        return ResponseEntity.ok(ApiResponse.success(invoiceService.updateInvoice(id, request)));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<InvoiceResponse>> cancelInvoice(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(invoiceService.cancelInvoice(id)));
    }

    @PostMapping("/register-payment")
    public ResponseEntity<ApiResponse<InvoiceResponse>> registerPayment(
            @Valid @RequestBody RegisterPaymentRequest request) {
        return ResponseEntity.ok(ApiResponse.success(invoiceService.registerPayment(request)));
    }

    @GetMapping("/overdue")
    public ResponseEntity<ApiResponse<List<InvoiceResponse>>> getOverdueInvoices() {
        return ResponseEntity.ok(ApiResponse.success(invoiceService.getOverdueInvoices()));
    }
}
