package com.escriba.pos.controller;

import com.escriba.pos.dto.response.ApiResponse;
import com.escriba.pos.model.entity.*;
import com.escriba.pos.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/catalogs")
@RequiredArgsConstructor
public class CatalogController {

    private final BrandRepository brandRepository;
    private final UnitRepository unitRepository;
    private final BankRepository bankRepository;

    // ==================== BRANDS ====================

    @GetMapping("/brands")
    public ResponseEntity<ApiResponse<List<Brand>>> getBrands() {
        return ResponseEntity.ok(ApiResponse.success(brandRepository.findByActiveTrueOrderByName()));
    }

    @PostMapping("/brands")
    @PreAuthorize("hasRole('AD')")
    public ResponseEntity<ApiResponse<Brand>> createBrand(@RequestBody Brand brand) {
        if (brand.getName() == null || brand.getName().trim().isEmpty())
            return ResponseEntity.badRequest().body(ApiResponse.error("El nombre es requerido"));
        return ResponseEntity.ok(ApiResponse.success("Marca creada", brandRepository.save(brand)));
    }

    @PutMapping("/brands/{id}")
    @PreAuthorize("hasRole('AD')")
    public ResponseEntity<ApiResponse<Brand>> updateBrand(@PathVariable Integer id, @RequestBody Brand brand) {
        Brand existing = brandRepository.findById(id).orElse(null);
        if (existing == null) return ResponseEntity.badRequest().body(ApiResponse.error("Marca no encontrada"));
        existing.setName(brand.getName());
        existing.setDescription(brand.getDescription());
        existing.setActive(brand.getActive() != null ? brand.getActive() : existing.getActive());
        return ResponseEntity.ok(ApiResponse.success("Marca actualizada", brandRepository.save(existing)));
    }

    @DeleteMapping("/brands/{id}")
    @PreAuthorize("hasRole('AD')")
    public ResponseEntity<ApiResponse<Void>> deleteBrand(@PathVariable Integer id) {
        brandRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success("Marca eliminada", null));
    }

    // ==================== UNITS ====================

    @GetMapping("/units")
    public ResponseEntity<ApiResponse<List<Unit>>> getUnits() {
        return ResponseEntity.ok(ApiResponse.success(unitRepository.findByActiveTrueOrderByName()));
    }

    @PostMapping("/units")
    @PreAuthorize("hasRole('AD')")
    public ResponseEntity<ApiResponse<Unit>> createUnit(@RequestBody Unit unit) {
        if (unit.getName() == null || unit.getName().trim().isEmpty())
            return ResponseEntity.badRequest().body(ApiResponse.error("El nombre es requerido"));
        return ResponseEntity.ok(ApiResponse.success("Unidad creada", unitRepository.save(unit)));
    }

    @PutMapping("/units/{id}")
    @PreAuthorize("hasRole('AD')")
    public ResponseEntity<ApiResponse<Unit>> updateUnit(@PathVariable Integer id, @RequestBody Unit unit) {
        Unit existing = unitRepository.findById(id).orElse(null);
        if (existing == null) return ResponseEntity.badRequest().body(ApiResponse.error("Unidad no encontrada"));
        existing.setName(unit.getName());
        existing.setCode(unit.getCode());
        existing.setType(unit.getType());
        existing.setActive(unit.getActive() != null ? unit.getActive() : existing.getActive());
        return ResponseEntity.ok(ApiResponse.success("Unidad actualizada", unitRepository.save(existing)));
    }

    @DeleteMapping("/units/{id}")
    @PreAuthorize("hasRole('AD')")
    public ResponseEntity<ApiResponse<Void>> deleteUnit(@PathVariable Integer id) {
        unitRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success("Unidad eliminada", null));
    }

    // ==================== BANKS ====================

    @GetMapping("/banks")
    public ResponseEntity<ApiResponse<List<Bank>>> getBanks() {
        return ResponseEntity.ok(ApiResponse.success(bankRepository.findByActiveTrueOrderByName()));
    }

    @PostMapping("/banks")
    @PreAuthorize("hasRole('AD')")
    public ResponseEntity<ApiResponse<Bank>> createBank(@RequestBody Bank bank) {
        if (bank.getName() == null || bank.getName().trim().isEmpty())
            return ResponseEntity.badRequest().body(ApiResponse.error("El nombre es requerido"));
        return ResponseEntity.ok(ApiResponse.success("Banco creado", bankRepository.save(bank)));
    }

    @PutMapping("/banks/{id}")
    @PreAuthorize("hasRole('AD')")
    public ResponseEntity<ApiResponse<Bank>> updateBank(@PathVariable Short id, @RequestBody Bank bank) {
        Bank existing = bankRepository.findById(id).orElse(null);
        if (existing == null) return ResponseEntity.badRequest().body(ApiResponse.error("Banco no encontrado"));
        existing.setName(bank.getName());
        existing.setCode(bank.getCode());
        existing.setActive(bank.getActive() != null ? bank.getActive() : existing.getActive());
        return ResponseEntity.ok(ApiResponse.success("Banco actualizado", bankRepository.save(existing)));
    }

    @DeleteMapping("/banks/{id}")
    @PreAuthorize("hasRole('AD')")
    public ResponseEntity<ApiResponse<Void>> deleteBank(@PathVariable Short id) {
        bankRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success("Banco eliminado", null));
    }
}
