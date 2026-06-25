package com.escriba.pos.controller;

import com.escriba.pos.dto.response.ApiResponse;
import com.escriba.pos.model.entity.Supplier;
import com.escriba.pos.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/suppliers")
@RequiredArgsConstructor
public class SupplierController {

    private final SupplierRepository supplierRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Supplier>>> getAll(@RequestParam UUID companyId) {
        return ResponseEntity.ok(ApiResponse.success(
                supplierRepository.findByCompanyIdOrderByBusinessName(companyId)));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<Supplier>>> search(
            @RequestParam UUID companyId,
            @RequestParam String term) {
        return ResponseEntity.ok(ApiResponse.success(
                supplierRepository.searchByCompanyId(companyId, term)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Supplier>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(
                supplierRepository.findById(id).orElse(null)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Supplier>> create(@RequestBody Supplier supplier) {
        return ResponseEntity.ok(ApiResponse.success(
                "Proveedor creado exitosamente", supplierRepository.save(supplier)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Supplier>> update(
            @PathVariable UUID id, @RequestBody Supplier supplier) {
        supplier.setId(id);
        return ResponseEntity.ok(ApiResponse.success(
                "Proveedor actualizado", supplierRepository.save(supplier)));
    }
}
