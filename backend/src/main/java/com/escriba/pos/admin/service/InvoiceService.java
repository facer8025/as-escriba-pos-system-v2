package com.escriba.pos.admin.service;

import com.escriba.pos.admin.exception.AdminBusinessException;
import com.escriba.pos.admin.model.dto.request.CreateInvoiceRequest;
import com.escriba.pos.admin.model.dto.request.RegisterPaymentRequest;
import com.escriba.pos.admin.model.dto.request.UpdateInvoiceRequest;
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
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final TenantInvoiceRepository invoiceRepository;
    private final TenantRepository tenantRepository;

    @Transactional(readOnly = true)
    public Page<InvoiceResponse> listInvoices(String status, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size);
        if (status != null && !status.isBlank()) {
            return invoiceRepository.findByStatus(status, pageRequest).map(this::toResponse);
        }
        return invoiceRepository.findAll(pageRequest).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public InvoiceResponse getInvoice(UUID id) {
        TenantInvoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new AdminBusinessException("Factura no encontrada"));
        return toResponse(invoice);
    }

    @Transactional
    public InvoiceResponse createInvoice(CreateInvoiceRequest request, AdminUser createdBy) {
        Tenant tenant = tenantRepository.findById(request.getTenantId())
                .orElseThrow(() -> new AdminBusinessException("Empresa no encontrada"));

        BigDecimal taxAmount = request.getAmountNet()
                .multiply(request.getTaxPct())
                .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
        BigDecimal total = request.getAmountNet().add(taxAmount);

        String invoiceNumber = nextInvoiceNumber();

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
    public InvoiceResponse updateInvoice(UUID id, UpdateInvoiceRequest request) {
        TenantInvoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new AdminBusinessException("Factura no encontrada"));

        if ("PAID".equals(invoice.getStatus()) || "CANCELLED".equals(invoice.getStatus())) {
            throw new AdminBusinessException("No se puede editar una factura " + invoice.getStatus().toLowerCase());
        }

        if (request.getConcept() != null && !request.getConcept().isBlank()) {
            invoice.setConcept(request.getConcept());
        }
        if (request.getDescription() != null) {
            invoice.setDescription(request.getDescription());
        }
        if (request.getAmountNet() != null && request.getAmountNet().signum() >= 0) {
            BigDecimal taxPct = request.getTaxPct() != null ? request.getTaxPct() : invoice.getTaxPct();
            BigDecimal taxAmount = request.getAmountNet()
                    .multiply(taxPct)
                    .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
            invoice.setAmountNet(request.getAmountNet());
            invoice.setTaxPct(taxPct);
            invoice.setTaxAmount(taxAmount);
            invoice.setTotal(request.getAmountNet().add(taxAmount));
        }
        if (request.getIssueDate() != null) {
            invoice.setIssuedAt(request.getIssueDate().atStartOfDay());
        }
        if (request.getDueDate() != null) {
            invoice.setDueDate(request.getDueDate());
        }
        if (request.getExpectedPaymentMethod() != null) {
            invoice.setPaymentMethod(request.getExpectedPaymentMethod());
        }
        if (request.getNotes() != null) {
            invoice.setNotes(request.getNotes());
        }

        invoice = invoiceRepository.save(invoice);
        return toResponse(invoice);
    }

    @Transactional
    public InvoiceResponse cancelInvoice(UUID id) {
        TenantInvoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new AdminBusinessException("Factura no encontrada"));

        if ("PAID".equals(invoice.getStatus())) {
            throw new AdminBusinessException("No se puede cancelar una factura ya pagada");
        }
        invoice.setStatus("CANCELLED");
        invoice = invoiceRepository.save(invoice);
        return toResponse(invoice);
    }

    @Transactional
    public InvoiceResponse registerPayment(RegisterPaymentRequest request) {
        TenantInvoice invoice = invoiceRepository.findById(request.getInvoiceId())
                .orElseThrow(() -> new AdminBusinessException("Factura no encontrada"));

        if ("PAID".equals(invoice.getStatus())) {
            throw new AdminBusinessException("La factura ya está pagada");
        }
        if ("CANCELLED".equals(invoice.getStatus())) {
            throw new AdminBusinessException("No se puede registrar un pago sobre una factura cancelada");
        }
        if (request.getAmount().compareTo(invoice.getTotal()) < 0) {
            throw new AdminBusinessException("El monto del pago no cubre el total de la factura (" + invoice.getTotal() + ")");
        }

        invoice.setStatus("PAID");
        invoice.setPaidAt(request.getPaymentDate().atStartOfDay());
        invoice.setPaymentMethod(request.getPaymentMethod());
        invoice.setPaymentReference(request.getReference());
        if (request.getNotes() != null && !request.getNotes().isBlank()) {
            invoice.setNotes(request.getNotes());
        }
        invoice = invoiceRepository.save(invoice);
        return toResponse(invoice);
    }

    @Transactional(readOnly = true)
    public List<InvoiceResponse> getOverdueInvoices() {
        return invoiceRepository.findByStatusAndDueDateBefore("PENDING", LocalDate.now())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Genera el siguiente número de factura basándose en la cantidad de
     * facturas con el prefijo de hoy (evita colisiones y no depende de
     * la fecha de emisión de facturas anteriores).
     */
    private String nextInvoiceNumber() {
        String day = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        long countToday = invoiceRepository.countByInvoiceNumberPrefix("INV-" + day + "-");
        return "INV-" + day + "-" + String.format("%04d", countToday + 1);
    }

    private InvoiceResponse toResponse(TenantInvoice invoice) {
        return InvoiceResponse.builder()
                .id(invoice.getId())
                .tenantId(invoice.getTenant().getId())
                .tenantName(invoice.getTenant().getBusinessName())
                .invoiceNumber(invoice.getInvoiceNumber())
                .concept(invoice.getConcept())
                .description(invoice.getDescription())
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
                .notes(invoice.getNotes())
                .pdfUrl(invoice.getPdfUrl())
                .build();
    }
}
