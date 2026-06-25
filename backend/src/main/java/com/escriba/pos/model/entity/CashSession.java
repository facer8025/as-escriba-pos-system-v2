package com.escriba.pos.model.entity;

import com.escriba.pos.model.enums.CashSessionStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "cash_sessions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(of = "id")
public class CashSession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "register_id", nullable = false)
    private CashRegister register;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "opened_at", nullable = false)
    private LocalDateTime openedAt;

    @Column(name = "opening_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal openingAmount;

    @Column(name = "opening_denominations")
    @JdbcTypeCode(SqlTypes.JSON)
    private String openingDenominations;

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    @Column(name = "closing_amount", precision = 18, scale = 2)
    private BigDecimal closingAmount;

    @Column(name = "closing_denominations")
    @JdbcTypeCode(SqlTypes.JSON)
    private String closingDenominations;

    @Column(name = "counted_amount", precision = 18, scale = 2)
    private BigDecimal countedAmount;

    @Column(name = "difference_amount", precision = 18, scale = 2)
    private BigDecimal differenceAmount;

    @Column(name = "cash_withdrawn", precision = 18, scale = 2)
    private BigDecimal cashWithdrawn;

    @Column(name = "base_for_next_session", precision = 18, scale = 2)
    private BigDecimal baseForNextSession;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private CashSessionStatus status;

    private String notes;

    @Column(name = "total_sales")
    private Integer totalSales;

    @Column(name = "total_sales_amount", precision = 18, scale = 2)
    private BigDecimal totalSalesAmount;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) status = CashSessionStatus.OPEN;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
