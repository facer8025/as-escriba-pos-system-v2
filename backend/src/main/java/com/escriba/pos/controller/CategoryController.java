package com.escriba.pos.controller;

import com.escriba.pos.dto.response.ApiResponse;
import com.escriba.pos.exception.BusinessException;
import com.escriba.pos.model.entity.Category;
import com.escriba.pos.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryRepository categoryRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Category>>> getAll(@RequestParam UUID companyId) {
        return ResponseEntity.ok(ApiResponse.success(
                categoryRepository.findActiveByCompanyId(companyId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Category>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(
                categoryRepository.findById(id).orElse(null)));
    }

    @PostMapping
    @PreAuthorize("hasRole('AD')")
    public ResponseEntity<ApiResponse<Category>> create(@RequestBody Category category) {
        if (category.getCompany() == null || category.getCompany().getId() == null) {
            throw new BusinessException("La categoría debe pertenecer a una empresa");
        }
        if (category.getName() == null || category.getName().trim().isEmpty()) {
            throw new BusinessException("El nombre de la categoría es requerido");
        }
        if (category.getParent() != null && category.getParent().getId() != null) {
            Category parent = categoryRepository.findById(category.getParent().getId())
                    .orElseThrow(() -> new BusinessException("Categoría padre no encontrada"));
            category.setParent(parent);
        }
        Category saved = categoryRepository.save(category);
        return ResponseEntity.ok(ApiResponse.success("Categoría creada", saved));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('AD')")
    public ResponseEntity<ApiResponse<Category>> update(@PathVariable UUID id, @RequestBody Category category) {
        Category existing = categoryRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Categoría no encontrada"));
        existing.setName(category.getName());
        existing.setDescription(category.getDescription());
        existing.setColor(category.getColor());
        existing.setSortOrder(category.getSortOrder());
        if (category.getParent() != null && category.getParent().getId() != null) {
            Category parent = categoryRepository.findById(category.getParent().getId())
                    .orElseThrow(() -> new BusinessException("Categoría padre no encontrada"));
            existing.setParent(parent);
        } else {
            existing.setParent(null);
        }
        Category saved = categoryRepository.save(existing);
        return ResponseEntity.ok(ApiResponse.success("Categoría actualizada", saved));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('AD')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Categoría no encontrada"));
        long subcategories = categoryRepository.findByCompanyIdAndParentIdOrderByName(
                category.getCompany().getId(), id).size();
        if (subcategories > 0) {
            throw new BusinessException("No se puede eliminar: tiene " + subcategories + " subcategorías");
        }
        categoryRepository.delete(category);
        return ResponseEntity.ok(ApiResponse.success("Categoría eliminada", null));
    }
}
