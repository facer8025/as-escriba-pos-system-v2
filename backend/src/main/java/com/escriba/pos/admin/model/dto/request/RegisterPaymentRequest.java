package com.escriba.pos.admin.model.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class RegisterPaymentRequest {
    @NotNull private UUID invoiceId;
    @NotNull private LocalDate paymentDate;
    @NotNull @DecimalMin("0") private BigDecimal amount;
    @NotBlank private String paymentMethod;
    private String reference;
    private String notes;
}
