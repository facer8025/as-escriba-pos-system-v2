package com.escriba.pos.admin.model.dto.response;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data @Builder @AllArgsConstructor
public class LicenseResponse {
    private UUID id;
    private UUID tenantId;
    private String tenantName;
    private Integer planId;
    private String planName;
    private String licenseType;
    private String status;
    private LocalDateTime startsAt;
    private LocalDateTime expiresAt;
    private boolean autoRenew;
    private int gracePeriodDays;
    private BigDecimal pricePaidMonthly;
    private BigDecimal discountPct;
    private String discountReason;
    private String notes;
    private LocalDateTime createdAt;
}
