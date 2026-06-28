package com.escriba.pos.service;

import com.escriba.pos.dto.request.CreateProductRequest;
import com.escriba.pos.dto.response.ProductImageResponse;
import com.escriba.pos.dto.response.ProductResponse;
import com.escriba.pos.exception.BusinessException;
import com.escriba.pos.model.entity.Category;
import com.escriba.pos.model.entity.Company;
import com.escriba.pos.model.entity.Product;
import com.escriba.pos.model.entity.ProductImage;
import com.escriba.pos.model.enums.ProductStatus;
import com.escriba.pos.model.enums.VatType;
import com.escriba.pos.repository.*;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;
    private final CompanyRepository companyRepository;
    private final CategoryRepository categoryRepository;
    private final UnitRepository unitRepository;
    private final FileStorageService fileStorageService;
    private final NotificationService notificationService;

    public Page<ProductResponse> getProducts(UUID companyId, String search, UUID categoryId,
                                              String status, int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc") ?
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Specification<Product> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("company").get("id"), companyId));
            if (search != null && !search.trim().isEmpty()) {
                String pattern = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(
                    cb.like(cb.lower(root.get("name")), pattern),
                    cb.like(cb.lower(root.get("internalCode")), pattern),
                    cb.like(cb.lower(root.get("barcode")), pattern)
                ));
            }
            if (categoryId != null) {
                predicates.add(cb.equal(root.get("category").get("id"), categoryId));
            }
            if (status != null && !status.trim().isEmpty()) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return productRepository.findAll(spec, pageable)
                .map(this::toProductResponse);
    }

    public ProductResponse getProductById(UUID id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Producto no encontrado"));
        return toProductResponse(product);
    }

    public List<ProductResponse> getLowStockProducts(UUID companyId) {
        return productRepository.findLowStockProducts(companyId).stream()
                .map(this::toProductResponse)
                .collect(Collectors.toList());
    }

    public long countOutOfStock(UUID companyId) {
        return productRepository.countOutOfStock(companyId);
    }

    public BigDecimal getInventoryValue(UUID companyId) {
        BigDecimal value = productRepository.calculateInventoryValue(companyId);
        return value != null ? value : BigDecimal.ZERO;
    }

    public List<ProductResponse> searchByBarcode(UUID companyId, String barcode) {
        return productRepository.findByCompanyIdAndBarcode(companyId, barcode)
                .map(p -> List.of(toProductResponse(p)))
                .orElse(List.of());
    }

    // ==================== CRUD ====================

    @Transactional
    public ProductResponse createProduct(CreateProductRequest request) {
        Company company = companyRepository.findById(request.getCompanyId())
                .orElseThrow(() -> new BusinessException("Empresa no encontrada"));

        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new BusinessException("El nombre del producto es requerido");
        }

        var product = new Product();
        product.setCompany(company);
        product.setName(request.getName());
        product.setShortName(request.getShortName());
        product.setDescription(request.getDescription());
        product.setInternalCode(request.getInternalCode());
        product.setBarcode(request.getBarcode());
        product.setPurchasePrice(request.getPurchasePrice());
        product.setSalePrice(request.getSalePrice() != null ? request.getSalePrice() : BigDecimal.ZERO);
        product.setWholesalePrice(request.getWholesalePrice());
        product.setWeight(request.getWeight());

        // Category
        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new BusinessException("Categoría no encontrada"));
            product.setCategory(category);
        }

        // Unit
        if (request.getUnitId() != null) {
            var unit = unitRepository.findById(request.getUnitId())
                    .orElseThrow(() -> new BusinessException("Unidad no encontrada"));
            product.setUnit(unit);
        }

        // Status
        if (request.getStatus() != null) {
            try {
                product.setStatus(ProductStatus.valueOf(request.getStatus()));
            } catch (IllegalArgumentException e) {
                product.setStatus(ProductStatus.ACTIVE);
            }
        } else {
            product.setStatus(ProductStatus.ACTIVE);
        }

        // VAT
        if (request.getVatType() != null) {
            try {
                product.setVatType(VatType.valueOf(request.getVatType()));
            } catch (IllegalArgumentException e) {
                product.setVatType(VatType.STANDARD);
            }
        } else {
            product.setVatType(VatType.STANDARD);
        }
        product.setVatRate(request.getVatRate());
        product.setVatIncluded(request.getVatIncluded() != null && request.getVatIncluded());

        // Inventory
        product.setManageInventory(request.getManageInventory() != null && request.getManageInventory());
        product.setStockMin(request.getStockMin());
        product.setStockMax(request.getStockMax());
        product.setReorderPoint(request.getReorderPoint());
        product.setExpirationControl(request.getExpirationControl() != null && request.getExpirationControl());
        product.setCurrentStock(BigDecimal.ZERO);
        product.setAvgCost(BigDecimal.ZERO);

        Product saved = productRepository.save(product);

        // Notificar si el producto se creó sin stock o por debajo del mínimo
        notificationService.checkAndNotifyStockAlerts(saved, request.getCompanyId());

        return toProductResponse(saved);
    }

    @Transactional
    public ProductResponse updateProduct(UUID id, CreateProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Producto no encontrado"));

        if (request.getName() != null) product.setName(request.getName());
        if (request.getShortName() != null) product.setShortName(request.getShortName());
        if (request.getDescription() != null) product.setDescription(request.getDescription());
        if (request.getInternalCode() != null) product.setInternalCode(request.getInternalCode());
        if (request.getBarcode() != null) product.setBarcode(request.getBarcode());
        if (request.getPurchasePrice() != null) product.setPurchasePrice(request.getPurchasePrice());
        if (request.getSalePrice() != null) product.setSalePrice(request.getSalePrice());
        if (request.getWholesalePrice() != null) product.setWholesalePrice(request.getWholesalePrice());
        if (request.getWeight() != null) product.setWeight(request.getWeight());

        // Category
        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new BusinessException("Categoría no encontrada"));
            product.setCategory(category);
        }

        // Unit
        if (request.getUnitId() != null) {
            var unit = unitRepository.findById(request.getUnitId())
                    .orElseThrow(() -> new BusinessException("Unidad no encontrada"));
            product.setUnit(unit);
        }

        // Status
        if (request.getStatus() != null) {
            try {
                product.setStatus(ProductStatus.valueOf(request.getStatus()));
            } catch (IllegalArgumentException ignored) {}
        }

        // VAT
        if (request.getVatType() != null) {
            try {
                product.setVatType(VatType.valueOf(request.getVatType()));
            } catch (IllegalArgumentException ignored) {}
        }
        if (request.getVatRate() != null) product.setVatRate(request.getVatRate());
        if (request.getVatIncluded() != null) product.setVatIncluded(request.getVatIncluded());

        // Inventory
        if (request.getManageInventory() != null) product.setManageInventory(request.getManageInventory());
        if (request.getStockMin() != null) product.setStockMin(request.getStockMin());
        if (request.getStockMax() != null) product.setStockMax(request.getStockMax());
        if (request.getReorderPoint() != null) product.setReorderPoint(request.getReorderPoint());
        if (request.getExpirationControl() != null) product.setExpirationControl(request.getExpirationControl());

        Product saved = productRepository.save(product);
        return toProductResponse(saved);
    }

    // ==================== Image Management ====================

    @Transactional
    public ProductImageResponse uploadImage(UUID productId, MultipartFile file, boolean isPrimary) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new BusinessException("Producto no encontrado"));

        // Count existing images (max 5)
        long imageCount = productImageRepository.countByProductId(productId);
        if (imageCount >= 5) {
            throw new BusinessException("Máximo 5 imágenes por producto");
        }

        // Store file
        String imageUrl = fileStorageService.storeFile(file);

        // If this is the first image or set as primary, clear other primaries
        if (isPrimary || imageCount == 0) {
            productImageRepository.clearPrimaryByProductId(productId);
        }

        // Build sort order
        int sortOrder = (int) imageCount;

        var productImage = ProductImage.builder()
                .product(product)
                .imageUrl(imageUrl)
                .isPrimary(isPrimary || imageCount == 0)
                .sortOrder(sortOrder)
                .build();

        ProductImage saved = productImageRepository.save(productImage);
        return toImageResponse(saved);
    }

    @Transactional
    public void deleteImage(UUID productId, UUID imageId) {
        ProductImage image = productImageRepository.findById(imageId)
                .orElseThrow(() -> new BusinessException("Imagen no encontrada"));

        if (!image.getProduct().getId().equals(productId)) {
            throw new BusinessException("La imagen no pertenece a este producto");
        }

        // Delete file from disk
        fileStorageService.deleteFile(image.getImageUrl());

        boolean wasPrimary = Boolean.TRUE.equals(image.getIsPrimary());
        productImageRepository.delete(image);

        // If the deleted image was primary, assign primary to the first remaining image
        if (wasPrimary) {
            productImageRepository.findFirstByProductIdOrderBySortOrderAsc(productId)
                    .ifPresent(first -> {
                        first.setIsPrimary(true);
                        productImageRepository.save(first);
                    });
        }
    }

    @Transactional
    public ProductImageResponse setPrimaryImage(UUID productId, UUID imageId) {
        ProductImage image = productImageRepository.findById(imageId)
                .orElseThrow(() -> new BusinessException("Imagen no encontrada"));

        if (!image.getProduct().getId().equals(productId)) {
            throw new BusinessException("La imagen no pertenece a este producto");
        }

        // Clear all primaries and set this one
        productImageRepository.clearPrimaryByProductId(productId);
        image.setIsPrimary(true);
        ProductImage saved = productImageRepository.save(image);
        return toImageResponse(saved);
    }

    public List<ProductImageResponse> getProductImages(UUID productId) {
        return productImageRepository.findByProductIdOrderBySortOrderAsc(productId)
                .stream()
                .map(this::toImageResponse)
                .collect(Collectors.toList());
    }

    // ==================== Mappers ====================

    private ProductImageResponse toImageResponse(ProductImage image) {
        return ProductImageResponse.builder()
                .id(image.getId())
                .imageUrl(image.getImageUrl())
                .isPrimary(Boolean.TRUE.equals(image.getIsPrimary()))
                .sortOrder(image.getSortOrder() != null ? image.getSortOrder() : 0)
                .createdAt(image.getCreatedAt())
                .build();
    }

    private ProductResponse toProductResponse(Product product) {
        // Get primary image via separate query to avoid LazyInitializationException
        String mainImageUrl = productImageRepository
                .findPrimaryImageUrlByProductId(product.getId())
                .orElse(null);

        return ProductResponse.builder()
                .id(product.getId())
                .internalCode(product.getInternalCode())
                .barcode(product.getBarcode())
                .name(product.getName())
                .shortName(product.getShortName())
                .description(product.getDescription())
                .categoryId(product.getCategory() != null ? product.getCategory().getId() : null)
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                .categoryColor(product.getCategory() != null ? product.getCategory().getColor() : null)
                .brandId(product.getBrand() != null ? product.getBrand().getId() : null)
                .brandName(product.getBrand() != null ? product.getBrand().getName() : null)
                .unitCode(product.getUnit() != null ? product.getUnit().getCode() : null)
                .unitName(product.getUnit() != null ? product.getUnit().getName() : null)
                .status(product.getStatus() != null ? product.getStatus().name() : "ACTIVE")
                .purchasePrice(product.getPurchasePrice())
                .salePrice(product.getSalePrice())
                .wholesalePrice(product.getWholesalePrice())
                .vatType(product.getVatType() != null ? product.getVatType().name() : "STANDARD")
                .vatRate(product.getVatRate())
                .vatIncluded(product.getVatIncluded() != null && product.getVatIncluded())
                .manageInventory(product.getManageInventory() != null && product.getManageInventory())
                .currentStock(product.getCurrentStock())
                .avgCost(product.getAvgCost())
                .stockMin(product.getStockMin())
                .stockMax(product.getStockMax())
                .reorderPoint(product.getReorderPoint())
                .mainImageUrl(mainImageUrl)
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }
}
