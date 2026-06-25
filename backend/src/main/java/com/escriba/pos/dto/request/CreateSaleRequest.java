package com.escriba.pos.dto.request;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
public class CreateSaleRequest {
    private UUID companyId;
    private UUID branchId;
    private UUID customerId;
    private UUID sessionId;
    private UUID sellerId;
    private String documentType; // TICKET, POS_EQUIVALENT, INVOICE
    private String discountType; // %, $
    private BigDecimal discountValue;
    private String notes;
    private List<SaleItemRequest> items;
    private List<SalePaymentRequest> payments;

    @Data
    public static class SaleItemRequest {
        private UUID productId;
        private BigDecimal quantity;
        private BigDecimal unitPrice;
        private String discountType;
        private BigDecimal discountValue;
        private BigDecimal discountAmount;
        private BigDecimal taxRate;
        private BigDecimal taxAmount;
        private BigDecimal subtotal;
        private BigDecimal total;
        private String notes;
    }

    @Data
    public static class SalePaymentRequest {
        private String paymentMethodCode;
        private String reference;
        private BigDecimal amount;
    }
}
