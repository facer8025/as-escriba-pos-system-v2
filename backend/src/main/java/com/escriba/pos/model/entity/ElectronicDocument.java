package com.escriba.pos.model.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "electronic_documents")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(of = "id")
public class ElectronicDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sale_id")
    private Sale sale;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resolution_id")
    private InvoiceResolution resolution;

    @Column(name = "document_number", nullable = false, length = 50)
    private String documentNumber;

    @Column(name = "document_type", nullable = false, length = 30)
    private String documentType;

    @Column(length = 255)
    private String cufe;

    @Column(name = "qr_url")
    private String qrUrl;

    @Column(name = "dian_status", length = 30)
    private String dianStatus;

    @Column(name = "dian_message")
    private String dianMessage;

    @Column(name = "dian_response")
    @JdbcTypeCode(SqlTypes.JSON)
    private String dianResponse;

    @Column(name = "xml_url")
    private String xmlUrl;

    @Column(name = "pdf_url")
    private String pdfUrl;

    @Column(name = "email_sent")
    private Boolean emailSent;

    @Column(name = "send_attempts")
    private Integer sendAttempts;

    @Column(name = "last_send_attempt")
    private LocalDateTime lastSendAttempt;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (dianStatus == null) dianStatus = "PENDING";
        if (sendAttempts == null) sendAttempts = 0;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
