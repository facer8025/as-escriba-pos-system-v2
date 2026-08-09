package com.escriba.pos.admin.service;

import com.escriba.pos.admin.model.dto.request.CreateInvoiceRequest;
import com.escriba.pos.admin.model.dto.request.RegisterPaymentRequest;
import com.escriba.pos.admin.model.dto.response.InvoiceResponse;
import com.escriba.pos.admin.model.entity.AdminUser;
import com.escriba.pos.admin.model.entity.Tenant;
import com.escriba.pos.admin.model.entity.TenantInvoice;
import com.escriba.pos.admin.repository.TenantInvoiceRepository;
import com.escriba.pos.admin.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final TenantInvoiceRepository invoiceRepository;
    private final TenantRepository tenantRepository;
    private static final AtomicInteger invoiceSeq = new AtomicInteger(1);

    public Page<InvoiceResponse> listInvoices(String status, int page, int size) {
        return invoiceRepository.findAll(PageRequest.of(page, size))
                .map(this::toResponse);
    }

    public InvoiceResponse getInvoice(UUID id) {
        TenantInvoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Factura no encontrada"));
        return toResponse(invoice);
    }

    @Transactional
    public InvoiceResponse createInvoice(CreateInvoiceRequest request, AdminUser createdBy) {
        Tenant tenant = tenantRepository.findById(request.getTenantId())
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));

        BigDecimal taxAmount = request.getAmountNet()
                .multiply(request.getTaxPct())
                .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
        BigDecimal total = request.getAmountNet().add(taxAmount);

        String invoiceNumber = "INV-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"))
                + "-" + String.format("%04d", invoiceSeq.getAndIncrement());

        TenantInvoice invoice = TenantInvoice.builder()
                .tenant(tenant)
                .invoiceNumber(invoiceNumber)
                .invoiceType("MANUAL")
                .concept(request.getConcept())
                .description(request.getDescription())
                .amountNet(request.getAmountNet())
                .taxPct(request.getTaxPct())
                .taxAmount(taxAmount)
                .total(total)
                .issuedAt(request.getIssueDate().atStartOfDay())
                .dueDate(request.getDueDate())
                .status("PENDING")
                .paymentMethod(request.getExpectedPaymentMethod())
                .notes(request.getNotes())
                .build();

        invoice = invoiceRepository.save(invoice);
        return toResponse(invoice);
    }

    @Transactional
    public InvoiceResponse registerPayment(RegisterPaymentRequest request) {
        TenantInvoice invoice = invoiceRepository.findById(request.getInvoiceId())
                .orElseThrow(() -> new RuntimeException("Factura no encontrada"));

        invoice.setStatus("PAID");
        invoice.setPaidAt(request.getPaymentDate().atStartOfDay());
        invoice.setPaymentMethod(request.getPaymentMethod());
        invoice.setPaymentReference(request.getReference());
        invoice = invoiceRepository.save(invoice);
        return toResponse(invoice);
    }

    public List<InvoiceResponse> getOverdueInvoices() {
        return invoiceRepository.findByTenantIdOrderByIssuedAtDesc(null)
                .stream()
                .filter(inv -> "PENDING".equals(inv.getStatus()) && inv.getDueDate().isBefore(LocalDate.now()))
                .map(this::toResponse)
                .toList();
    }

    private InvoiceResponse toResponse(TenantInvoice invoice) {
        return InvoiceResponse.builder()
                .id(invoice.getId())
                .tenantId(invoice.getTenant().getId())
                .tenantName(invoice.getTenant().getBusinessName())
                .invoiceNumber(invoice.getInvoiceNumber())
                .concept(invoice.getConcept())
                .amountNet(invoice.getAmountNet())
                .taxPct(invoice.getTaxPct())
                .taxAmount(invoice.getTaxAmount())
                .total(invoice.getTotal())
                .issuedAt(invoice.getIssuedAt())
                .dueDate(invoice.getDueDate())
                .paidAt(invoice.getPaidAt())
                .status(invoice.getStatus())
                .paymentMethod(invoice.getPaymentMethod())
                .paymentReference(invoice.getPaymentReference())
                .pdfUrl(invoice.getPdfUrl())
                .build();
    }
}
