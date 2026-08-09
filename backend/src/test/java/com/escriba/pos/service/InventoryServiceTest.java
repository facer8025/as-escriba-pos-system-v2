package com.escriba.pos.service;

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
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InventoryServiceTest {

    @Mock private InventoryMovementRepository movementRepository;
    @Mock private ProductRepository productRepository;
    @Mock private WarehouseRepository warehouseRepository;
    @Mock private UserRepository userRepository;
    @Mock private CompanyRepository companyRepository;
    @Mock private NotificationService notificationService;

    private InventoryService inventoryService;

    private UUID companyId, productId, warehouseId, userId;
    private Company company;
    private User user;
    private Warehouse warehouse;
    private Product product;

    @BeforeEach
    void setUp() {
        inventoryService = new InventoryService(movementRepository, productRepository,
                warehouseRepository, userRepository, companyRepository, notificationService);

        companyId = UUID.randomUUID();
        productId = UUID.randomUUID();
        warehouseId = UUID.randomUUID();
        userId = UUID.randomUUID();

        company = Company.builder().id(companyId).name("ESCRIBA SAS").build();
        user = User.builder().id(userId).firstName("Ana").lastName("Lopez").build();
        warehouse = Warehouse.builder().id(warehouseId).name("Bodega Principal").build();
        product = Product.builder()
                .id(productId)
                .name("Café 500g")
                .manageInventory(true)
                .currentStock(new BigDecimal("100"))
                .avgCost(new BigDecimal("12000"))
                .build();
    }

    @Test
    @DisplayName("getKardex delega al repositorio ordenado por fecha")
    void getKardex_retornaMovimientos() {
        InventoryMovement m = InventoryMovement.builder().id(UUID.randomUUID()).build();
        when(movementRepository.findByProductIdOrderByCreatedAtAsc(productId)).thenReturn(List.of(m));

        var result = inventoryService.getKardex(productId, LocalDateTime.now().minusDays(30), LocalDateTime.now());

        assertEquals(1, result.size());
        verify(movementRepository).findByProductIdOrderByCreatedAtAsc(productId);
    }

    @Test
    @DisplayName("registerEntry con stock cero: el costo promedio toma el costo de entrada")
    void registerEntry_stockCero_avgCostEsElUnitCost() {
        product.setCurrentStock(BigDecimal.ZERO);
        product.setAvgCost(null);

        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(warehouseRepository.findById(warehouseId)).thenReturn(Optional.of(warehouse));
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(movementRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        inventoryService.registerEntry(companyId, productId, warehouseId,
                new BigDecimal("50"), new BigDecimal("10000"), "PURCHASE", "Compra inicial", userId);

        assertEquals(new BigDecimal("50"), product.getCurrentStock());
        assertEquals(new BigDecimal("10000"), product.getAvgCost(), "Con stock 0 el avg cost es el costo unitario");
        verify(productRepository).save(product);
    }

    @Test
    @DisplayName("registerEntry calcula costo promedio ponderado correctamente")
    void registerEntry_costoPromedioPonderado() {
        // Stock 100 @ 12000 + entrada 100 @ 10000 → (100*12000 + 100*10000) / 200 = 11000
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(warehouseRepository.findById(warehouseId)).thenReturn(Optional.of(warehouse));
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(movementRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        inventoryService.registerEntry(companyId, productId, warehouseId,
                new BigDecimal("100"), new BigDecimal("10000"), "PURCHASE", null, userId);

        assertEquals(new BigDecimal("200"), product.getCurrentStock());
        assertEquals(new BigDecimal("11000.00"), product.getAvgCost());

        ArgumentCaptor<InventoryMovement> captor = ArgumentCaptor.forClass(InventoryMovement.class);
        verify(movementRepository).save(captor.capture());
        InventoryMovement m = captor.getValue();
        assertEquals(MovementType.MANUAL_ENTRY, m.getMovementType());
        assertEquals(new BigDecimal("100"), m.getQuantity());
        assertEquals(new BigDecimal("100"), m.getStockBefore());
        assertEquals(new BigDecimal("200"), m.getStockAfter());
    }

    @Test
    @DisplayName("registerEntry con producto inexistente lanza BusinessException")
    void registerEntry_productoNoEncontrado_lanzaExcepcion() {
        when(productRepository.findById(productId)).thenReturn(Optional.empty());

        assertThrows(BusinessException.class, () -> inventoryService.registerEntry(
                companyId, productId, warehouseId, BigDecimal.ONE, BigDecimal.TEN, null, null, userId));
        verify(movementRepository, never()).save(any());
    }

    @Test
    @DisplayName("registerExit descuenta stock y registra cantidad negativa")
    void registerExit_descuentaStock() {
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(warehouseRepository.findById(warehouseId)).thenReturn(Optional.of(warehouse));
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(movementRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        inventoryService.registerExit(companyId, productId, warehouseId,
                new BigDecimal("30"), "DAÑO", "Producto dañado", userId);

        assertEquals(new BigDecimal("70"), product.getCurrentStock());

        ArgumentCaptor<InventoryMovement> captor = ArgumentCaptor.forClass(InventoryMovement.class);
        verify(movementRepository).save(captor.capture());
        InventoryMovement m = captor.getValue();
        assertEquals(MovementType.MANUAL_EXIT, m.getMovementType());
        assertEquals(new BigDecimal("-30"), m.getQuantity());
        assertEquals(new BigDecimal("100"), m.getStockBefore());
        assertEquals(new BigDecimal("70"), m.getStockAfter());
        verify(notificationService).checkAndNotifyStockAlerts(product, companyId);
    }

    @Test
    @DisplayName("registerExit con stock insuficiente lanza BusinessException")
    void registerExit_stockInsuficiente_lanzaExcepcion() {
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));

        BusinessException ex = assertThrows(BusinessException.class, () -> inventoryService.registerExit(
                companyId, productId, warehouseId, new BigDecimal("500"), "VENTA", null, userId));
        assertTrue(ex.getMessage().contains("Stock insuficiente"));
        assertEquals(new BigDecimal("100"), product.getCurrentStock(), "No debe modificar stock");
        verify(movementRepository, never()).save(any());
    }

    @Test
    @DisplayName("quickAdjustment DIRECT al alza registra ajuste positivo")
    void quickAdjustment_alAlza_ajustePositivo() {
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(warehouseRepository.findById(warehouseId)).thenReturn(Optional.of(warehouse));
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(movementRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        inventoryService.quickAdjustment(companyId, productId, warehouseId, "DIRECT",
                new BigDecimal("150"), "Conteo", null, userId);

        ArgumentCaptor<InventoryMovement> captor = ArgumentCaptor.forClass(InventoryMovement.class);
        verify(movementRepository).save(captor.capture());
        InventoryMovement m = captor.getValue();
        assertEquals(MovementType.ADJUSTMENT_POSITIVE, m.getMovementType());
        assertEquals(new BigDecimal("50"), m.getQuantity());
        assertEquals(new BigDecimal("100"), m.getStockBefore());
        assertEquals(new BigDecimal("150"), m.getStockAfter());
    }

    @Test
    @DisplayName("quickAdjustment DIRECT a la baja registra ajuste negativo")
    void quickAdjustment_aLaBaja_ajusteNegativo() {
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(warehouseRepository.findById(warehouseId)).thenReturn(Optional.of(warehouse));
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(movementRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        inventoryService.quickAdjustment(companyId, productId, warehouseId, "DIRECT",
                new BigDecimal("40"), "Conteo", null, userId);

        ArgumentCaptor<InventoryMovement> captor = ArgumentCaptor.forClass(InventoryMovement.class);
        verify(movementRepository).save(captor.capture());
        assertEquals(MovementType.ADJUSTMENT_NEGATIVE, captor.getValue().getMovementType());
        assertEquals(new BigDecimal("-60"), captor.getValue().getQuantity());
    }

    @Test
    @DisplayName("quickAdjustment con tipo no soportado lanza BusinessException")
    void quickAdjustment_tipoNoSoportado_lanzaExcepcion() {
        assertThrows(BusinessException.class, () -> inventoryService.quickAdjustment(
                companyId, productId, warehouseId, "PERCENT", BigDecimal.TEN, null, null, userId));
        verify(movementRepository, never()).save(any());
    }

    @Test
    @DisplayName("getSummary retorna métricas de inventario")
    void getSummary_retornaMetricas() {
        Product lowStock = Product.builder().id(UUID.randomUUID()).name("Bajo").build();
        when(productRepository.count()).thenReturn(50L);
        when(productRepository.countOutOfStock(companyId)).thenReturn(3L);
        when(productRepository.findLowStockProducts(companyId)).thenReturn(List.of(lowStock));
        when(productRepository.calculateInventoryValue(companyId)).thenReturn(new BigDecimal("12500000"));

        var summary = inventoryService.getSummary(companyId);

        assertEquals(50L, summary.get("totalProducts"));
        assertEquals(3L, summary.get("outOfStock"));
        assertEquals(1L, summary.get("criticalStock"));
        assertEquals(new BigDecimal("12500000"), summary.get("inventoryValue"));
    }
}
