package com.escriba.pos.admin.model.entity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "license_history")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class LicenseHistory {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "license_id", nullable = false)
    private License license;
    @Column(name = "change_type", nullable = false, length = 30)
    private String changeType;
    @Column(name = "old_value", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String oldValue;
    @Column(name = "new_value", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String newValue;
    @Column(columnDefinition = "TEXT")
    private String notes;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "changed_by")
    private AdminUser changedBy;
    @Column(name = "changed_at", updatable = false)
    private LocalDateTime changedAt;
    @PrePersist
    protected void onCreate() { changedAt = LocalDateTime.now(); }
}
