package com.escriba.pos.model.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "suppliers", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"company_id", "document_number"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(of = "id")
public class Supplier {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(name = "person_type", length = 10)
    private String personType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_type_id")
    private IdType documentType;

    @Column(name = "document_number", length = 30)
    private String documentNumber;

    @Column(length = 2)
    private String dv;

    @Column(name = "business_name", nullable = false, length = 200)
    private String businessName;

    @Column(name = "trade_name", length = 200)
    private String tradeName;

    @Column(name = "tax_regime", length = 50)
    private String taxRegime;

    private String address;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "city_id")
    private City city;

    @Column(length = 30)
    private String phone;

    @Column(length = 30)
    private String cellphone;

    @Column(length = 150)
    private String email;

    @Column(length = 255)
    private String website;

    @Column(name = "contact_name", length = 150)
    private String contactName;

    @Column(name = "contact_role", length = 100)
    private String contactRole;

    @Column(name = "logo_url")
    private String logoUrl;

    @Column(name = "payment_term", length = 30)
    private String paymentTerm;

    @Column(name = "payment_term_days")
    private Integer paymentTermDays;

    @Column(length = 3)
    private String currency;

    @Column(name = "default_discount", precision = 5, scale = 2)
    private BigDecimal defaultDiscount;

    @Column(name = "early_payment_discount", precision = 5, scale = 2)
    private BigDecimal earlyPaymentDiscount;

    @Column(name = "min_order_amount", precision = 18, scale = 2)
    private BigDecimal minOrderAmount;

    @Column(name = "delivery_days")
    private Integer deliveryDays;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bank_id")
    private Bank bank;

    @Column(name = "bank_account_type", length = 20)
    private String bankAccountType;

    @Column(name = "bank_account_number", length = 50)
    private String bankAccountNumber;

    private Short rating;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(columnDefinition = "TEXT[]")
    private String[] tags;

    @Column(name = "internal_notes")
    private String internalNotes;

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
