package com.escriba.pos.dto.request;

import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class CreateProductRequest {
    private UUID companyId;
    private UUID categoryId;
    private UUID warehouseId;

    private String internalCode;
    private String barcode;
    private String name;
    private String shortName;
    private String description;
    private Integer unitId;
    private String status;

    private BigDecimal purchasePrice;
    private BigDecimal salePrice;
    private BigDecimal wholesalePrice;

    private String vatType;
    private BigDecimal vatRate;
    private Boolean vatIncluded;

    private Boolean manageInventory;
    private BigDecimal stockMin;
    private BigDecimal stockMax;
    private BigDecimal reorderPoint;
    private BigDecimal weight;
    private Boolean expirationControl;
}
