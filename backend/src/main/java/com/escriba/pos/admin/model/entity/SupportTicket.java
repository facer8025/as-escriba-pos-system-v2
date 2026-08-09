package com.escriba.pos.admin.model.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "support_tickets")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class SupportTicket {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @Column(name = "ticket_number", unique = true, nullable = false, length = 20)
    private String ticketNumber;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id")
    private Tenant tenant;
    @Column(nullable = false, length = 200)
    private String subject;
    @Column(nullable = false, length = 30)
    private String category;
    @Column(nullable = false, length = 10)
    @Builder.Default
    private String priority = "MEDIUM";
    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "OPEN";
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to")
    private AdminUser assignedTo;
    @Column(name = "sla_deadline")
    private LocalDateTime slaDeadline;
    @Column(name = "sla_breached")
    private Boolean slaBreached = false;
    @Column(name = "created_by_type", nullable = false, length = 10)
    private String createdByType;
    @Column(name = "created_by_id", nullable = false)
    private UUID createdById;
    @Column(name = "closed_at")
    private LocalDateTime closedAt;
    @Column(name = "resolution_summary", columnDefinition = "TEXT")
    private String resolutionSummary;
    @Column(name = "root_cause", length = 30)
    private String rootCause;
    @Column(name = "satisfaction_score")
    private Short satisfactionScore;
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); updatedAt = LocalDateTime.now(); }
    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }
}
