package com.escriba.pos.model.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "companies")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(of = "id")
public class Company {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(name = "trade_name", length = 200)
    private String tradeName;

    @Column(nullable = false, unique = true, length = 20)
    private String nit;

    @Column(length = 2)
    private String dv;

    @Column(name = "person_type", length = 20)
    private String personType;

    @Column(name = "tax_regime", length = 50)
    private String taxRegime;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "tax_responsibilities", columnDefinition = "TEXT[]")
    private String[] taxResponsibilities;

    @Column(name = "ciiu_code", length = 10)
    private String ciiuCode;

    private String address;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "city_id")
    private City city;

    @Column(name = "postal_code", length = 10)
    private String postalCode;

    @Column(length = 30)
    private String phone;

    @Column(length = 30)
    private String cellphone;

    @Column(length = 150)
    private String email;

    @Column(length = 255)
    private String website;

    @Column(name = "logo_url")
    private String logoUrl;

    @Column(name = "favicon_url")
    private String faviconUrl;

    @Column(name = "primary_color", length = 7)
    private String primaryColor;

    @Column(name = "secondary_color", length = 7)
    private String secondaryColor;

    @Column(name = "smtp_host")
    private String smtpHost;

    @Column(name = "smtp_port")
    private Integer smtpPort;

    @Column(name = "smtp_security", length = 10)
    private String smtpSecurity;

    @Column(name = "smtp_user")
    private String smtpUser;

    @Column(name = "smtp_password")
    private String smtpPassword;

    @Column(name = "smtp_sender_name", length = 100)
    private String smtpSenderName;

    @Column(name = "smtp_sender_email", length = 150)
    private String smtpSenderEmail;

    @Column(name = "invoice_footer")
    private String invoiceFooter;

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
