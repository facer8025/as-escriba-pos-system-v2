package com.escriba.pos.admin.model.dto.request;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class CreateLicenseRequest {
    @NotNull private UUID tenantId;
    @NotNull private Integer planId;
    @NotBlank private String licenseType;
    @NotNull private LocalDate startDate;
    @NotNull private int durationMonths;
    private boolean autoRenew = true;
    private int gracePeriodDays = 7;
    @DecimalMin("0") @DecimalMax("100") private BigDecimal discountPct = BigDecimal.ZERO;
    private String discountReason;
    private String notes;
    private boolean notifyTenant = true;
}
