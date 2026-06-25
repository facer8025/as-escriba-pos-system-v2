package com.escriba.pos.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "invoice_resolutions", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"company_id", "prefix", "document_type"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(of = "id")
public class InvoiceResolution {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(name = "document_type", nullable = false, length = 30)
    private String documentType;

    @Column(length = 10)
    private String prefix;

    @Column(name = "resolution_number", nullable = false, length = 50)
    private String resolutionNumber;

    @Column(name = "resolution_date", nullable = false)
    private LocalDate resolutionDate;

    @Column(name = "start_number", nullable = false)
    private Integer startNumber;

    @Column(name = "end_number", nullable = false)
    private Integer endNumber;

    @Column(name = "current_number", nullable = false)
    private Integer currentNumber;

    @Column(name = "expiration_date", nullable = false)
    private LocalDate expirationDate;

    @Column(name = "technical_key")
    private String technicalKey;

    @Column(nullable = false)
    private Boolean active = true;

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
