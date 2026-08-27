package com.escriba.pos.admin.model.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class UpdateLicenseRequest {
    private Integer planId;
    private String licenseType;
    private String status;
    private LocalDate startsAt;
    private LocalDate expiresAt;
    private Boolean autoRenew;
    private Integer gracePeriodDays;
    @DecimalMin("0") @DecimalMax("100")
    private BigDecimal discountPct;
    private String discountReason;
    private String notes;
}
