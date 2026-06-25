package com.escriba.pos.controller;

import com.escriba.pos.dto.response.ApiResponse;
import com.escriba.pos.model.entity.ElectronicDocument;
import com.escriba.pos.model.entity.InvoiceResolution;
import com.escriba.pos.repository.ElectronicDocumentRepository;
import com.escriba.pos.repository.InvoiceResolutionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final ElectronicDocumentRepository electronicDocumentRepository;
    private final InvoiceResolutionRepository invoiceResolutionRepository;

    // ========== Electronic Documents (issued invoices) ==========

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ElectronicDocument>>> getInvoices(
            @RequestParam UUID companyId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {

        Page<ElectronicDocument> docs = electronicDocumentRepository.findByFilters(
                companyId, status,
                PageRequest.of(page, size, Sort.by("createdAt").descending()));

        return ResponseEntity.ok(ApiResponse.success(docs));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ElectronicDocument>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(
                electronicDocumentRepository.findById(id).orElse(null)));
    }

    // ========== Invoice Resolutions ==========

    @GetMapping("/resolutions")
    public ResponseEntity<ApiResponse<List<InvoiceResolution>>> getResolutions(
            @RequestParam UUID companyId) {
        return ResponseEntity.ok(ApiResponse.success(
                invoiceResolutionRepository.findByCompanyIdOrderByCreatedAtDesc(companyId)));
    }

    @PostMapping("/resolutions")
    public ResponseEntity<ApiResponse<InvoiceResolution>> createResolution(
            @RequestBody InvoiceResolution resolution) {
        return ResponseEntity.ok(ApiResponse.success(
                "Resolución creada", invoiceResolutionRepository.save(resolution)));
    }
}
