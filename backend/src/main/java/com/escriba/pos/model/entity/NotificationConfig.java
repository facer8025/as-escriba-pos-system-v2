package com.escriba.pos.model.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "notification_config", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"company_id", "notification_type"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(of = "id")
public class NotificationConfig {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(name = "notification_type", nullable = false, length = 50)
    private String notificationType;

    @Column(name = "email_enabled")
    private Boolean emailEnabled;

    @Column(name = "in_app_enabled")
    private Boolean inAppEnabled;

    @Column(name = "push_enabled")
    private Boolean pushEnabled;

    @JdbcTypeCode(SqlTypes.ARRAY)
    private List<String> recipients = new ArrayList<>();

    @Column(name = "digest_frequency", length = 20)
    private String digestFrequency;

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
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
