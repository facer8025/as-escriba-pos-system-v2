package com.escriba.pos.admin.model.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "tenants")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(of = "id")
public class Tenant {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "person_type", length = 10)
    @Builder.Default
    private String personType = "LEGAL";

    @Column(nullable = false, unique = true, length = 20)
    private String nit;

    @Column(length = 2)
    private String dv;

    @Column(name = "business_name", nullable = false, length = 200)
    private String businessName;

    @Column(name = "trade_name", length = 200)
    private String tradeName;

    @Column(name = "tax_regime", length = 50)
    private String taxRegime;

    @Column(name = "tax_responsibilities", columnDefinition = "TEXT")
    private String taxResponsibilities;

    @Column(name = "ciiu_code", length = 10)
    private String ciiuCode;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(length = 100)
    private String department;

    @Column(length = 100)
    private String city;

    @Column(length = 30)
    private String phone;

    @Column(nullable = false, length = 150, unique = true)
    private String email;

    @Column(length = 255)
    private String website;

    @Column(name = "logo_url")
    private String logoUrl;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "TRIAL";

    @Column(name = "suspension_reason", columnDefinition = "TEXT")
    private String suspensionReason;

    @Column(name = "schema_name", nullable = false, unique = true, length = 100)
    private String schemaName;

    @Column(length = 100, unique = true)
    private String subdomain;

    @Column(length = 50)
    @Builder.Default
    private String timezone = "America/Bogota";

    @Column(name = "registered_at")
    private LocalDateTime registeredAt;

    @Column(name = "activated_at")
    private LocalDateTime activatedAt;

    @Column(name = "suspended_at")
    private LocalDateTime suspendedAt;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private AdminUser createdBy;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (registeredAt == null) registeredAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }
}
