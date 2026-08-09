package com.escriba.pos.admin.model.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "tenant_feature_flags", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"tenant_id", "flag_code"})
})
@Data @NoArgsConstructor @AllArgsConstructor @Builder
@EqualsAndHashCode(of = "id")
public class TenantFeatureFlag {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @Column(name = "flag_code", nullable = false, length = 50)
    private String flagCode;

    @Column(name = "is_enabled")
    @Builder.Default
    private Boolean isEnabled = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "enabled_by")
    private AdminUser enabledBy;

    @Column(name = "enabled_at")
    private LocalDateTime enabledAt;

    @PrePersist
    protected void onCreate() { if (enabledAt == null) enabledAt = LocalDateTime.now(); }
}
