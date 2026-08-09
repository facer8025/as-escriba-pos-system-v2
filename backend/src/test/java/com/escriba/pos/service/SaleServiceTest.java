package com.escriba.pos.service;

import com.escriba.pos.dto.request.CreateSaleRequest;
import com.escriba.pos.exception.BusinessException;
import com.escriba.pos.model.entity.*;
import com.escriba.pos.model.enums.MovementType;
import com.escriba.pos.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SaleServiceTest {

    @Mock private SaleRepository saleRepository;
    @Mock private ProductRepository productRepository;
    @Mock private CustomerRepository customerRepository;
    @Mock private CompanyRepository companyRepository;
    @Mock private BranchRepository branchRepository;
    @Mock private UserRepository userRepository;
    @Mock private CashSessionRepository cashSessionRepository;
    @Mock private PaymentMethodRepository paymentMethodRepository;
    @Mock private InventoryMovementRepository movementRepository;
    @Mock private NotificationService notificationService;

    private SaleService saleService;

    private UUID companyId;
    private UUID sellerId;
    private UUID productId;
    private Company company;
    private User seller;
    private Product product;

    @BeforeEach
    void setUp() {
        saleService = new SaleService(saleRepository, productRepository, customerRepository,
                companyRepository, branchRepository, userRepository, cashSessionRepository,
                paymentMethodRepository, movementRepository, notificationService);

        companyId = UUID.randomUUID();
        sellerId = UUID.randomUUID();
        productId = UUID.randomUUID();

        company = Company.builder().id(companyId).name("ESCRIBA SAS").build();
        seller = User.builder().id(sellerId).firstName("Juan").lastName("Perez").build();

        product = Product.builder()
                .id(productId)
                .name("Café Premium 500g")
                .manageInventory(true)
                .currentStock(new BigDecimal("50"))
                .avgCost(new BigDecimal("10000"))
                .build();
    }

    private CreateSaleRequest buildRequest(int quantity, int unitPrice, String paymentMethodCode) {
        CreateSaleRequest request = new CreateSaleRequest();
        request.setCompanyId(companyId);
        request.setSellerId(sellerId);
        request.setDocumentType("TICKET");

        CreateSaleRequest.SaleItemRequest item = new CreateSaleRequest.SaleItemRequest();
        item.setProductId(productId);
        item.setQuantity(new BigDecimal(quantity));
        item.setUnitPrice(new BigDecimal(unitPrice));
        item.setTaxRate(new BigDecimal("19"));
        item.setTaxAmount(new BigDecimal("0"));
        request.setItems(List.of(item));

        CreateSaleRequest.SalePaymentRequest payment = new CreateSaleRequest.SalePaymentRequest();
        payment.setPaymentMethodCode(paymentMethodCode);
        payment.setAmount(new BigDecimal(quantity * unitPrice));
        request.setPayments(List.of(payment));

        return request;
    }

    @Test
    @DisplayName("Venta exitosa: calcula totales, descuenta stock y registra kardex")
    void createSale_ventaExitosa_calculaTotalesYDescuentaStock() {
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));
        when(userRepository.findById(sellerId)).thenReturn(Optional.of(seller));
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(saleRepository.countByCompanyIdAndSaleNumberStartingWith(any(), any())).thenReturn(0L);
        when(saleRepository.save(any(Sale.class))).thenAnswer(inv -> inv.getArgument(0));
        PaymentMethod cash = PaymentMethod.builder().id(1).code("CASH").name("Efectivo").build();
        when(paymentMethodRepository.findByCode("CASH")).thenReturn(Optional.of(cash));

        CreateSaleRequest request = buildRequest(2, 15000, "CASH");
        Sale saved = saleService.createSale(request);

        // Totales: 2 x 15000 = 30000 subtotal, sin descuento, IVA 0 (el cliente lo envía)
        assertEquals(new BigDecimal("30000"), saved.getSubtotal());
        assertEquals(new BigDecimal("30000"), saved.getTotal());
        assertEquals("F-" + java.time.LocalDate.now()
                .format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd")) + "-0001", saved.getSaleNumber());

        // Stock descontado: 50 - 2 = 48
        assertEquals(new BigDecimal("48"), product.getCurrentStock());
        verify(productRepository, times(1)).save(product);

        // Kardex: 1 movimiento de tipo SALE con cantidad negativa
        ArgumentCaptor<InventoryMovement> movementCaptor = ArgumentCaptor.forClass(InventoryMovement.class);
        verify(movementRepository, times(1)).save(movementCaptor.capture());
        InventoryMovement movement = movementCaptor.getValue();
        assertEquals(MovementType.SALE, movement.getMovementType());
        assertEquals(new BigDecimal("-2"), movement.getQuantity());
        assertEquals(new BigDecimal("50"), movement.getStockBefore());
        assertEquals(new BigDecimal("48"), movement.getStockAfter());
        assertEquals("SALE", movement.getReferenceType());
    }

    @Test
    @DisplayName("Empresa no encontrada lanza BusinessException")
    void createSale_empresaNoEncontrada_lanzaExcepcion() {
        when(companyRepository.findById(companyId)).thenReturn(Optional.empty());

        CreateSaleRequest request = buildRequest(1, 10000, "CASH");
        BusinessException ex = assertThrows(BusinessException.class, () -> saleService.createSale(request));
        assertEquals("Empresa no encontrada", ex.getMessage());
        verify(saleRepository, never()).save(any());
    }

    @Test
    @DisplayName("Vendedor no encontrado lanza BusinessException")
    void createSale_vendedorNoEncontrado_lanzaExcepcion() {
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));
        when(userRepository.findById(sellerId)).thenReturn(Optional.empty());

        CreateSaleRequest request = buildRequest(1, 10000, "CASH");
        assertThrows(BusinessException.class, () -> saleService.createSale(request));
    }

    @Test
    @DisplayName("Producto no encontrado lanza BusinessException")
    void createSale_productoNoEncontrado_lanzaExcepcion() {
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));
        when(userRepository.findById(sellerId)).thenReturn(Optional.of(seller));
        when(productRepository.findById(productId)).thenReturn(Optional.empty());

        CreateSaleRequest request = buildRequest(1, 10000, "CASH");
        BusinessException ex = assertThrows(BusinessException.class, () -> saleService.createSale(request));
        assertTrue(ex.getMessage().contains("Producto no encontrado"));
        verify(saleRepository, never()).save(any());
    }

    @Test
    @DisplayName("Stock insuficiente lanza BusinessException y no descuenta")
    void createSale_stockInsuficiente_lanzaExcepcion() {
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));
        when(userRepository.findById(sellerId)).thenReturn(Optional.of(seller));
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));

        // Pide 60, hay 50
        CreateSaleRequest request = buildRequest(60, 10000, "CASH");
        BusinessException ex = assertThrows(BusinessException.class, () -> saleService.createSale(request));
        assertTrue(ex.getMessage().contains("Stock insuficiente"));
        assertEquals(new BigDecimal("50"), product.getCurrentStock(), "El stock no debe modificarse");
        verify(saleRepository, never()).save(any());
        verify(movementRepository, never()).save(any());
    }

    @Test
    @DisplayName("Descuento global porcentual se aplica sobre el subtotal")
    void createSale_descuentoGlobalPorcentaje_seAplica() {
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));
        when(userRepository.findById(sellerId)).thenReturn(Optional.of(seller));
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(saleRepository.countByCompanyIdAndSaleNumberStartingWith(any(), any())).thenReturn(0L);
        when(saleRepository.save(any(Sale.class))).thenAnswer(inv -> inv.getArgument(0));
        PaymentMethod cash = PaymentMethod.builder().id(1).code("CASH").build();
        when(paymentMethodRepository.findByCode("CASH")).thenReturn(Optional.of(cash));

        CreateSaleRequest request = buildRequest(2, 15000, "CASH"); // subtotal 30000
        request.setDiscountType("%");
        request.setDiscountValue(new BigDecimal("10")); // 10% = 3000

        Sale saved = saleService.createSale(request);

        assertEquals(new BigDecimal("30000"), saved.getSubtotal());
        assertEquals(new BigDecimal("3000.00"), saved.getDiscountTotal());
        assertEquals(new BigDecimal("27000.00"), saved.getTotal());
    }

    @Test
    @DisplayName("Descuento global fijo no puede exceder el subtotal")
    void createSale_descuentoGlobalFijo_noExcedeSubtotal() {
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));
        when(userRepository.findById(sellerId)).thenReturn(Optional.of(seller));
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(saleRepository.countByCompanyIdAndSaleNumberStartingWith(any(), any())).thenReturn(0L);
        when(saleRepository.save(any(Sale.class))).thenAnswer(inv -> inv.getArgument(0));
        PaymentMethod cash = PaymentMethod.builder().id(1).code("CASH").build();
        when(paymentMethodRepository.findByCode("CASH")).thenReturn(Optional.of(cash));

        CreateSaleRequest request = buildRequest(1, 10000, "CASH"); // subtotal 10000
        request.setDiscountType("$");
        request.setDiscountValue(new BigDecimal("50000")); // más que el subtotal

        Sale saved = saleService.createSale(request);

        // min(50000, 10000) = 10000 → total 0, nunca negativo
        assertEquals(new BigDecimal("10000"), saved.getDiscountTotal());
        assertEquals(new BigDecimal("0"), saved.getTotal());
    }

    @Test
    @DisplayName("Medio de pago no encontrado lanza BusinessException")
    void createSale_medioPagoNoEncontrado_lanzaExcepcion() {
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));
        when(userRepository.findById(sellerId)).thenReturn(Optional.of(seller));
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(saleRepository.countByCompanyIdAndSaleNumberStartingWith(any(), any())).thenReturn(0L);
        when(paymentMethodRepository.findByCode("CASH")).thenReturn(Optional.empty());

        CreateSaleRequest request = buildRequest(1, 10000, "CASH");
        BusinessException ex = assertThrows(BusinessException.class, () -> saleService.createSale(request));
        assertTrue(ex.getMessage().contains("Medio de pago no encontrado"));
        verify(saleRepository, never()).save(any());
    }

    @Test
    @DisplayName("Producto sin control de inventario no registra movimiento kardex")
    void createSale_sinInventario_noRegistraMovimiento() {
        product.setManageInventory(false);
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));
        when(userRepository.findById(sellerId)).thenReturn(Optional.of(seller));
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(saleRepository.countByCompanyIdAndSaleNumberStartingWith(any(), any())).thenReturn(0L);
        when(saleRepository.save(any(Sale.class))).thenAnswer(inv -> inv.getArgument(0));
        PaymentMethod cash = PaymentMethod.builder().id(1).code("CASH").build();
        when(paymentMethodRepository.findByCode("CASH")).thenReturn(Optional.of(cash));

        CreateSaleRequest request = buildRequest(1, 10000, "CASH");
        saleService.createSale(request);

        verify(movementRepository, never()).save(any());
        verify(productRepository, never()).save(any());
    }

    @Test
    @DisplayName("Número de venta incrementa según ventas previas del día")
    void createSale_numeroSecuencial_incrementa() {
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));
        when(userRepository.findById(sellerId)).thenReturn(Optional.of(seller));
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(saleRepository.countByCompanyIdAndSaleNumberStartingWith(any(), any())).thenReturn(7L);
        when(saleRepository.save(any(Sale.class))).thenAnswer(inv -> inv.getArgument(0));
        PaymentMethod cash = PaymentMethod.builder().id(1).code("CASH").build();
        when(paymentMethodRepository.findByCode("CASH")).thenReturn(Optional.of(cash));

        CreateSaleRequest request = buildRequest(1, 10000, "CASH");
        Sale saved = saleService.createSale(request);

        String expectedPrefix = "F-" + java.time.LocalDate.now()
                .format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd")) + "-";
        assertTrue(saved.getSaleNumber().startsWith(expectedPrefix));
        assertEquals(expectedPrefix + "0008", saved.getSaleNumber());
    }
}
