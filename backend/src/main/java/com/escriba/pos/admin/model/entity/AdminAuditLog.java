package com.escriba.pos.admin.model.entity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "admin_audit_logs")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class AdminAuditLog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private LocalDateTime timestamp;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admin_user_id")
    private AdminUser adminUser;
    @Column(name = "admin_email", length = 150)
    private String adminEmail;
    @Column(name = "admin_role", length = 5)
    private String adminRole;
    @Column(nullable = false, length = 30)
    private String category;
    @Column(nullable = false, length = 100)
    private String action;
    @Column(columnDefinition = "TEXT")
    private String description;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_tenant_id")
    private Tenant targetTenant;
    @Column(length = 50)
    private String module;
    @Column(name = "entity_type", length = 50)
    private String entityType;
    @Column(name = "entity_id", length = 50)
    private String entityId;
    @Column(columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String dataBefore;
    @Column(columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String dataAfter;
    @Column(name = "ip_address")
    private String ipAddress;
    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;
    @Column(name = "request_id", length = 100)
    private String requestId;
    @Column(nullable = false, length = 10)
    @Builder.Default
    private String result = "SUCCESS";
}
