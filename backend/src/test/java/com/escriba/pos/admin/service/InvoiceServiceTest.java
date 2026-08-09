package com.escriba.pos.admin.service;

import com.escriba.pos.admin.model.dto.request.CreateInvoiceRequest;
import com.escriba.pos.admin.model.dto.request.RegisterPaymentRequest;
import com.escriba.pos.admin.model.dto.response.InvoiceResponse;
import com.escriba.pos.admin.model.entity.AdminUser;
import com.escriba.pos.admin.model.entity.Tenant;
import com.escriba.pos.admin.model.entity.TenantInvoice;
import com.escriba.pos.admin.repository.TenantInvoiceRepository;
import com.escriba.pos.admin.repository.TenantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InvoiceServiceTest {

    @Mock private TenantInvoiceRepository invoiceRepository;
    @Mock private TenantRepository tenantRepository;

    private InvoiceService invoiceService;
    private AdminUser admin;
    private Tenant tenant;
    private TenantInvoice invoice;
    private UUID tenantId, invoiceId;

    @BeforeEach
    void setUp() {
        invoiceService = new InvoiceService(invoiceRepository, tenantRepository);
        admin = AdminUser.builder().email("admin@escriba.co").build();
        tenantId = UUID.randomUUID();
        invoiceId = UUID.randomUUID();

        tenant = Tenant.builder().id(tenantId).businessName("ESCRIBA SAS").build();
        invoice = TenantInvoice.builder()
                .id(invoiceId)
                .tenant(tenant)
                .invoiceNumber("INV-20260801-0001")
                .concept("Mensualidad Plan Pro")
                .amountNet(new BigDecimal("150000"))
                .taxPct(new BigDecimal("19"))
                .taxAmount(new BigDecimal("28500"))
                .total(new BigDecimal("178500"))
                .status("PENDING")
                .dueDate(LocalDate.now().plusDays(5))
                .build();
    }

    private CreateInvoiceRequest invoiceRequest() {
        CreateInvoiceRequest req = new CreateInvoiceRequest();
        req.setTenantId(tenantId);
        req.setConcept("Mensualidad Plan Pro");
        req.setIssueDate(LocalDate.now());
        req.setDueDate(LocalDate.now().plusDays(5));
        req.setAmountNet(new BigDecimal("150000"));
        req.setTaxPct(new BigDecimal("19"));
        req.setExpectedPaymentMethod("TRANSFER");
        return req;
    }

    @Test
    @DisplayName("createInvoice calcula IVA y total correctamente")
    void createInvoice_calculaIVA() {
        when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
        when(invoiceRepository.save(any(TenantInvoice.class))).thenAnswer(inv -> inv.getArgument(0));

        InvoiceResponse response = invoiceService.createInvoice(invoiceRequest(), admin);

        // IVA = 150.000 * 19 / 100 = 28.500; total = 178.500
        assertEquals(new BigDecimal("28500.00"), response.getTaxAmount());
        assertEquals(new BigDecimal("178500.00"), response.getTotal());
        assertEquals("PENDING", response.getStatus());

        ArgumentCaptor<TenantInvoice> captor = ArgumentCaptor.forClass(TenantInvoice.class);
        verify(invoiceRepository).save(captor.capture());
        TenantInvoice created = captor.getValue();
        assertTrue(created.getInvoiceNumber().startsWith("INV-"));
        assertEquals("MANUAL", created.getInvoiceType());
    }

    @Test
    @DisplayName("createInvoice con tenant inexistente lanza RuntimeException")
    void createInvoice_tenantNoEncontrado_lanzaExcepcion() {
        when(tenantRepository.findById(tenantId)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> invoiceService.createInvoice(invoiceRequest(), admin));
        verify(invoiceRepository, never()).save(any());
    }

    @Test
    @DisplayName("createInvoice con taxPct por defecto usa 19%")
    void createInvoice_taxPorDefecto() {
        when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
        when(invoiceRepository.save(any(TenantInvoice.class))).thenAnswer(inv -> inv.getArgument(0));

        CreateInvoiceRequest req = invoiceRequest();
        req.setTaxPct(new BigDecimal("0")); // sin IVA
        InvoiceResponse response = invoiceService.createInvoice(req, admin);

        assertEquals(new BigDecimal("0.00"), response.getTaxAmount());
        assertEquals(new BigDecimal("150000.00"), response.getTotal());
    }

    @Test
    @DisplayName("registerPayment marca la factura como PAID")
    void registerPayment_marcaComoPagada() {
        when(invoiceRepository.findById(invoiceId)).thenReturn(Optional.of(invoice));
        when(invoiceRepository.save(any(TenantInvoice.class))).thenAnswer(inv -> inv.getArgument(0));

        RegisterPaymentRequest req = new RegisterPaymentRequest();
        req.setInvoiceId(invoiceId);
        req.setPaymentDate(LocalDate.now());
        req.setAmount(new BigDecimal("178500"));
        req.setPaymentMethod("TRANSFER");
        req.setReference("TRF-123");

        InvoiceResponse response = invoiceService.registerPayment(req);

        assertEquals("PAID", response.getStatus());
        assertEquals("TRANSFER", invoice.getPaymentMethod());
        assertEquals("TRF-123", invoice.getPaymentReference());
        assertNotNull(invoice.getPaidAt());
    }

    @Test
    @DisplayName("getOverdueInvoices filtra solo PENDING vencidas")
    void getOverdueInvoices_filtraVencidas() {
        TenantInvoice overdue = TenantInvoice.builder()
                .id(UUID.randomUUID()).tenant(tenant)
                .invoiceNumber("INV-20260701-0001")
                .concept("Vencida")
                .amountNet(new BigDecimal("100000"))
                .taxPct(new BigDecimal("19"))
                .status("PENDING")
                .dueDate(LocalDate.now().minusDays(10))
                .build();
        TenantInvoice future = TenantInvoice.builder()
                .id(UUID.randomUUID()).tenant(tenant)
                .invoiceNumber("INV-20260801-0002")
                .concept("Futura")
                .amountNet(new BigDecimal("100000"))
                .taxPct(new BigDecimal("19"))
                .status("PENDING")
                .dueDate(LocalDate.now().plusDays(10))
                .build();
        TenantInvoice paid = TenantInvoice.builder()
                .id(UUID.randomUUID()).tenant(tenant)
                .invoiceNumber("INV-20260701-0002")
                .concept("Pagada")
                .amountNet(new BigDecimal("100000"))
                .taxPct(new BigDecimal("19"))
                .status("PAID")
                .dueDate(LocalDate.now().minusDays(5))
                .build();

        when(invoiceRepository.findByTenantIdOrderByIssuedAtDesc(null))
                .thenReturn(List.of(overdue, future, paid));

        var overdueList = invoiceService.getOverdueInvoices();

        assertEquals(1, overdueList.size());
        assertEquals("Vencida", overdueList.get(0).getConcept());
    }

    @Test
    @DisplayName("getInvoice con id inexistente lanza RuntimeException")
    void getInvoice_noEncontrada_lanzaExcepcion() {
        when(invoiceRepository.findById(invoiceId)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> invoiceService.getInvoice(invoiceId));
    }
}
