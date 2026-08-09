package com.escriba.pos.admin.model.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "admin_refresh_tokens")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class AdminRefreshToken {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admin_user_id", nullable = false)
    private AdminUser adminUser;
    @Column(name = "token_hash", nullable = false, length = 255)
    private String tokenHash;
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    @Column(name = "revoked_at")
    private LocalDateTime revokedAt;
    @Column(name = "ip_address")
    private String ipAddress;
    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;
    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }
    public boolean isExpired() { return LocalDateTime.now().isAfter(expiresAt); }
    public boolean isRevoked() { return revokedAt != null; }
}
