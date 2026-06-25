package com.escriba.pos.model.entity;

import com.escriba.pos.model.enums.ProductStatus;
import com.escriba.pos.model.enums.VatType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "products", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"company_id", "internal_code"}),
    @UniqueConstraint(columnNames = {"company_id", "barcode"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(of = "id")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "warehouse_id")
    private Warehouse warehouse;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "brand_id")
    private Brand brand;

    @Column(name = "internal_code", length = 30)
    private String internalCode;

    @Column(length = 50)
    private String barcode;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(name = "short_name", length = 80)
    private String shortName;

    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unit_id", nullable = false)
    private Unit unit;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private ProductStatus status;

    @Column(name = "purchase_price", precision = 18, scale = 2)
    private BigDecimal purchasePrice;

    @Column(name = "sale_price", nullable = false, precision = 18, scale = 2)
    private BigDecimal salePrice;

    @Column(name = "wholesale_price", precision = 18, scale = 2)
    private BigDecimal wholesalePrice;

    @Enumerated(EnumType.STRING)
    @Column(name = "vat_type", length = 20)
    private VatType vatType;

    @Column(name = "vat_rate", precision = 5, scale = 2)
    private BigDecimal vatRate;

    @Column(name = "vat_included")
    private Boolean vatIncluded;

    @Column(name = "manage_inventory")
    private Boolean manageInventory;

    @Column(name = "current_stock", precision = 18, scale = 3)
    private BigDecimal currentStock;

    @Column(name = "avg_cost", precision = 18, scale = 2)
    private BigDecimal avgCost;

    @Column(name = "stock_min", precision = 18, scale = 3)
    private BigDecimal stockMin;

    @Column(name = "stock_max", precision = 18, scale = 3)
    private BigDecimal stockMax;

    @Column(name = "reorder_point", precision = 18, scale = 3)
    private BigDecimal reorderPoint;

    @Column(precision = 10, scale = 3)
    private BigDecimal weight;

    @Column(name = "expiration_control")
    private Boolean expirationControl;

    @Column(name = "sort_order")
    private Integer sortOrder;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    @OrderBy("sortOrder ASC")
    private List<ProductImage> images = new ArrayList<>();

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) status = ProductStatus.ACTIVE;
        if (currentStock == null) currentStock = BigDecimal.ZERO;
        if (avgCost == null) avgCost = BigDecimal.ZERO;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
