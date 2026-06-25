package com.escriba.pos.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {
    private UUID id;
    private String internalCode;
    private String barcode;
    private String name;
    private String shortName;
    private String description;
    private UUID categoryId;
    private String categoryName;
    private String categoryColor;
    private Integer brandId;
    private String brandName;
    private String unitCode;
    private String unitName;
    private String status;
    private BigDecimal purchasePrice;
    private BigDecimal salePrice;
    private BigDecimal wholesalePrice;
    private String vatType;
    private BigDecimal vatRate;
    private boolean vatIncluded;
    private boolean manageInventory;
    private BigDecimal currentStock;
    private BigDecimal avgCost;
    private BigDecimal stockMin;
    private BigDecimal stockMax;
    private BigDecimal reorderPoint;
    private String mainImageUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
