package com.escriba.pos.admin.model.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "plans")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Plan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(unique = true, nullable = false, length = 50)
    private String slug;

    @Column(name = "description_short", length = 200)
    private String descriptionShort;

    @Column(name = "description_long", columnDefinition = "TEXT")
    private String descriptionLong;

    @Column(name = "price_monthly", nullable = false, precision = 18, scale = 2)
    private BigDecimal priceMonthly;

    @Column(name = "price_annual", nullable = false, precision = 18, scale = 2)
    private BigDecimal priceAnnual;

    @Column(name = "tax_rate", precision = 5, scale = 2)
    private BigDecimal taxRate = new BigDecimal("19");

    @Column(length = 3)
    private String currency = "COP";

    @Column(name = "trial_days")
    private Integer trialDays = 0;

    @Column(name = "badge_color", length = 7)
    private String badgeColor = "#4f46e5";

    @Column(name = "is_featured")
    private Boolean isFeatured = false;

    @Column(name = "is_visible_web")
    private Boolean isVisibleWeb = true;

    @Column(length = 20)
    @Builder.Default
    private String status = "ACTIVE";

    @Column(name = "max_users")
    private Integer maxUsers;

    @Column(name = "max_branches")
    private Integer maxBranches;

    @Column(name = "max_products")
    private Integer maxProducts;

    @Column(name = "max_monthly_invoices")
    private Integer maxMonthlyInvoices;

    @Column(name = "storage_gb")
    private Integer storageGb;

    @Column(name = "support_level", length = 30)
    private String supportLevel;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private AdminUser createdBy;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }
}
