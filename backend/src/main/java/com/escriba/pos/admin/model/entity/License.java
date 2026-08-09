package com.escriba.pos.admin.model.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "licenses")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class License {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id", nullable = false)
    private Plan plan;

    @Column(name = "license_type", nullable = false, length = 10)
    private String licenseType = "PAID";

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "ACTIVE";

    @Column(name = "starts_at", nullable = false)
    private LocalDateTime startsAt;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "auto_renew")
    private Boolean autoRenew = true;

    @Column(name = "grace_period_days")
    private Integer gracePeriodDays = 7;

    @Column(name = "price_paid_monthly", precision = 18, scale = 2)
    private BigDecimal pricePaidMonthly;

    @Column(name = "discount_pct", precision = 5, scale = 2)
    private BigDecimal discountPct = BigDecimal.ZERO;

    @Column(name = "discount_reason", columnDefinition = "TEXT")
    private String discountReason;

    @Column(columnDefinition = "TEXT")
    private String notes;

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
