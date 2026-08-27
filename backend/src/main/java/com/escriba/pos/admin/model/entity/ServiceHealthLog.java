package com.escriba.pos.admin.model.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;

@Entity
@Table(name = "service_health_logs")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
@EqualsAndHashCode(of = "id")
public class ServiceHealthLog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "service_name", nullable = false, length = 50)
    private String serviceName;

    @Column(name = "checked_at", nullable = false)
    private LocalDateTime checkedAt;

    @Column(nullable = false, length = 10)
    private String status;

    @Column(name = "response_time_ms")
    private Integer responseTimeMs;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "JSONB")
    private String details;

    @PrePersist
    protected void onCreate() { if (checkedAt == null) checkedAt = LocalDateTime.now(); }
}
