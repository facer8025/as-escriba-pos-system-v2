package com.escriba.pos.admin.model.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "tenant_modules", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"tenant_id", "module_code"})
})
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class TenantModule {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;
    @Column(name = "module_code", nullable = false, length = 30)
    private String moduleCode;
    @Column(name = "is_enabled")
    private Boolean isEnabled = false;
    @Column(name = "is_trial")
    private Boolean isTrial = false;
    @Column(name = "trial_expires_at")
    private LocalDateTime trialExpiresAt;
    @Column(name = "enabled_at")
    private LocalDateTime enabledAt;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "enabled_by")
    private AdminUser enabledBy;
    @Column(columnDefinition = "TEXT")
    private String notes;
}
