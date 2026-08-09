package com.escriba.pos.admin.model.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data @Builder @AllArgsConstructor
public class InvoiceResponse {
    private UUID id;
    private UUID tenantId;
    private String tenantName;
    private String invoiceNumber;
    private String concept;
    private BigDecimal amountNet;
    private BigDecimal taxPct;
    private BigDecimal taxAmount;
    private BigDecimal total;
    private LocalDateTime issuedAt;
    private LocalDate dueDate;
    private LocalDateTime paidAt;
    private String status;
    private String paymentMethod;
    private String paymentReference;
    private String pdfUrl;
}
