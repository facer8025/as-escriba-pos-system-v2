package com.escriba.pos.admin.model.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class CreateInvoiceRequest {
    @NotNull private UUID tenantId;
    @NotBlank private String concept;
    private String description;
    @NotNull private LocalDate issueDate;
    @NotNull private LocalDate dueDate;
    @NotNull @DecimalMin("0") private BigDecimal amountNet;
    @DecimalMin("0") @DecimalMax("100") private BigDecimal taxPct = new BigDecimal("19");
    private String expectedPaymentMethod;
    private String notes;
    private boolean notifyTenant = true;
}
