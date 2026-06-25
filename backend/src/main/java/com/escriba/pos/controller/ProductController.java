package com.escriba.pos.controller;

import com.escriba.pos.dto.request.CreateProductRequest;
import com.escriba.pos.dto.response.ApiResponse;
import com.escriba.pos.dto.response.ProductImageResponse;
import com.escriba.pos.dto.response.ProductResponse;
import com.escriba.pos.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    // ==================== GET ====================

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> getProducts(
            @RequestParam UUID companyId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {
        return ResponseEntity.ok(ApiResponse.success(
                productService.getProducts(companyId, search, categoryId, status, page, size, sortBy, sortDir)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> getProduct(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(productService.getProductById(id)));
    }

    @GetMapping("/low-stock")
    @PreAuthorize("hasAnyRole('AD', 'BO')")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getLowStock(
            @RequestParam UUID companyId) {
        return ResponseEntity.ok(ApiResponse.success(productService.getLowStockProducts(companyId)));
    }

    @GetMapping("/inventory-value")
    @PreAuthorize("hasAnyRole('AD', 'BO')")
    public ResponseEntity<ApiResponse<BigDecimal>> getInventoryValue(
            @RequestParam UUID companyId) {
        return ResponseEntity.ok(ApiResponse.success(productService.getInventoryValue(companyId)));
    }

    @GetMapping("/barcode/{barcode}")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> findByBarcode(
            @RequestParam UUID companyId,
            @PathVariable String barcode) {
        return ResponseEntity.ok(ApiResponse.success(productService.searchByBarcode(companyId, barcode)));
    }

    // ==================== CREATE / UPDATE ====================

    @PostMapping
    @PreAuthorize("hasAnyRole('AD', 'BO', 'INV')")
    public ResponseEntity<ApiResponse<ProductResponse>> createProduct(
            @RequestBody CreateProductRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Producto creado", productService.createProduct(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('AD', 'BO', 'INV')")
    public ResponseEntity<ApiResponse<ProductResponse>> updateProduct(
            @PathVariable UUID id,
            @RequestBody CreateProductRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Producto actualizado", productService.updateProduct(id, request)));
    }

    // ==================== IMAGES ====================

    @PostMapping(value = "/{productId}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('AD', 'BO', 'INV')")
    public ResponseEntity<ApiResponse<ProductImageResponse>> uploadImage(
            @PathVariable UUID productId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "primary", defaultValue = "false") boolean primary) {
        return ResponseEntity.ok(ApiResponse.success(
                "Imagen subida", productService.uploadImage(productId, file, primary)));
    }

    @GetMapping("/{productId}/images")
    public ResponseEntity<ApiResponse<List<ProductImageResponse>>> getProductImages(
            @PathVariable UUID productId) {
        return ResponseEntity.ok(ApiResponse.success(productService.getProductImages(productId)));
    }

    @DeleteMapping("/{productId}/images/{imageId}")
    @PreAuthorize("hasAnyRole('AD', 'BO', 'INV')")
    public ResponseEntity<ApiResponse<Void>> deleteImage(
            @PathVariable UUID productId,
            @PathVariable UUID imageId) {
        productService.deleteImage(productId, imageId);
        return ResponseEntity.ok(ApiResponse.success("Imagen eliminada", null));
    }

    @PutMapping("/{productId}/images/{imageId}/primary")
    @PreAuthorize("hasAnyRole('AD', 'BO', 'INV')")
    public ResponseEntity<ApiResponse<ProductImageResponse>> setPrimaryImage(
            @PathVariable UUID productId,
            @PathVariable UUID imageId) {
        return ResponseEntity.ok(ApiResponse.success(
                "Imagen principal actualizada", productService.setPrimaryImage(productId, imageId)));
    }
}
