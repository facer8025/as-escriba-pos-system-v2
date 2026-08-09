package com.escriba.pos.admin.model.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "maintenance_windows")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
@EqualsAndHashCode(of = "id")
public class MaintenanceWindow {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "starts_at", nullable = false)
    private LocalDateTime startsAt;

    @Column(name = "estimated_duration_min", nullable = false)
    private Integer estimatedDurationMin;

    @Column(nullable = false, length = 30)
    private String scope;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "notify_hours_before")
    @Builder.Default
    private Integer notifyHoursBefore = 4;

    @Column(name = "banner_from_at")
    private LocalDateTime bannerFromAt;

    @Column(length = 20)
    @Builder.Default
    private String status = "SCHEDULED";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private AdminUser createdBy;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); updatedAt = LocalDateTime.now(); }
    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }
}
