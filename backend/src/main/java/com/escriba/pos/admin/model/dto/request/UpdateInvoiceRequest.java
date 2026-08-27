package com.escriba.pos.admin.model.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class UpdateInvoiceRequest {
    private String concept;
    private String description;
    @DecimalMin("0")
    private BigDecimal amountNet;
    @DecimalMin("0") @DecimalMax("100")
    private BigDecimal taxPct;
    private LocalDate issueDate;
    private LocalDate dueDate;
    private String expectedPaymentMethod;
    private String notes;
}
