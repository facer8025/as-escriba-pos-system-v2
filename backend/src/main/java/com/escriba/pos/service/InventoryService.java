package com.escriba.pos.service;

import com.escriba.pos.dto.response.ApiResponse;
import com.escriba.pos.exception.BusinessException;
import com.escriba.pos.model.entity.*;
import com.escriba.pos.model.enums.MovementType;
import com.escriba.pos.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final InventoryMovementRepository movementRepository;
    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;
    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final NotificationService notificationService;

    public List<InventoryMovement> getKardex(UUID productId, LocalDateTime from, LocalDateTime to) {
        return movementRepository.findByProductIdOrderByCreatedAtAsc(productId);
    }

    @Transactional
    public InventoryMovement registerEntry(UUID companyId, UUID productId, UUID warehouseId,
                                            BigDecimal quantity, BigDecimal unitCost,
                                            String referenceType, String notes, UUID userId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new BusinessException("Producto no encontrado"));

        Warehouse warehouse = warehouseRepository.findById(warehouseId)
                .orElseThrow(() -> new BusinessException("Bodega no encontrada"));

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new BusinessException("Empresa no encontrada"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("Usuario no encontrado"));

        BigDecimal stockBefore = product.getCurrentStock() != null ? product.getCurrentStock() : BigDecimal.ZERO;
        BigDecimal stockAfter = stockBefore.add(quantity);

        // Actualizar costo promedio ponderado
        BigDecimal newAvgCost;
        if (stockBefore.compareTo(BigDecimal.ZERO) == 0) {
            newAvgCost = unitCost;
        } else {
            BigDecimal currentValue = stockBefore.multiply(product.getAvgCost() != null ? product.getAvgCost() : BigDecimal.ZERO);
            BigDecimal newValue = quantity.multiply(unitCost);
            newAvgCost = currentValue.add(newValue).divide(stockAfter, 2, java.math.RoundingMode.HALF_UP);
        }

        product.setCurrentStock(stockAfter);
        product.setAvgCost(newAvgCost);
        productRepository.save(product);

        InventoryMovement movement = InventoryMovement.builder()
                .company(company)
                .product(product)
                .warehouse(warehouse)
                .movementType(MovementType.MANUAL_ENTRY)
                .referenceType(referenceType != null ? referenceType : "MANUAL_ENTRY")
                .quantity(quantity)
                .unitCost(unitCost)
                .stockBefore(stockBefore)
                .stockAfter(stockAfter)
                .notes(notes)
                .createdBy(user)
                .build();

        return movementRepository.save(movement);
    }

    @Transactional
    public InventoryMovement registerExit(UUID companyId, UUID productId, UUID warehouseId,
                                           BigDecimal quantity, String reason,
                                           String notes, UUID userId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new BusinessException("Producto no encontrado"));

        BigDecimal stockBefore = product.getCurrentStock() != null ? product.getCurrentStock() : BigDecimal.ZERO;

        if (stockBefore.compareTo(quantity) < 0) {
            throw new BusinessException(
                    "Stock insuficiente. Disponible: " + stockBefore + ", solicitado: " + quantity);
        }

        BigDecimal stockAfter = stockBefore.subtract(quantity);

        product.setCurrentStock(stockAfter);
        productRepository.save(product);

        Warehouse warehouse = warehouseRepository.findById(warehouseId)
                .orElseThrow(() -> new BusinessException("Bodega no encontrada"));

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new BusinessException("Empresa no encontrada"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("Usuario no encontrado"));

        InventoryMovement movement = InventoryMovement.builder()
                .company(company)
                .product(product)
                .warehouse(warehouse)
                .movementType(MovementType.MANUAL_EXIT)
                .referenceType(reason != null ? reason : "MANUAL_EXIT")
                .quantity(quantity.negate())
                .unitCost(product.getAvgCost())
                .stockBefore(stockBefore)
                .stockAfter(stockAfter)
                .notes(notes)
                .createdBy(user)
                .build();

        // Notificar si el stock quedó bajo o agotado
        notificationService.checkAndNotifyStockAlerts(product, companyId);

        return movementRepository.save(movement);
    }

    @Transactional
    public InventoryMovement quickAdjustment(UUID companyId, UUID productId, UUID warehouseId,
                                              String adjustmentType, BigDecimal quantity,
                                              String reason, String notes, UUID userId) {
        if (adjustmentType.equals("DIRECT")) {
            // Ajuste directo: quantity es el nuevo stock
            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new BusinessException("Producto no encontrado"));

            BigDecimal stockBefore = product.getCurrentStock();
            BigDecimal difference = quantity.subtract(stockBefore);
            product.setCurrentStock(quantity);
            productRepository.save(product);

            Warehouse warehouse = warehouseRepository.findById(warehouseId)
                    .orElseThrow(() -> new BusinessException("Bodega no encontrada"));

            Company company = companyRepository.findById(companyId)
                    .orElseThrow(() -> new BusinessException("Empresa no encontrada"));

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new BusinessException("Usuario no encontrado"));

            MovementType type = difference.compareTo(BigDecimal.ZERO) >= 0
                    ? MovementType.ADJUSTMENT_POSITIVE : MovementType.ADJUSTMENT_NEGATIVE;

            InventoryMovement movement = InventoryMovement.builder()
                    .company(company)
                    .product(product)
                    .warehouse(warehouse)
                    .movementType(type)
                    .referenceType("ADJUSTMENT")
                    .quantity(difference)
                    .unitCost(product.getAvgCost())
                    .stockBefore(stockBefore)
                    .stockAfter(quantity)
                    .notes(notes)
                    .createdBy(user)
                    .build();

            // Notificar si el ajuste dejó el stock bajo o agotado
            notificationService.checkAndNotifyStockAlerts(product, companyId);

            return movementRepository.save(movement);
        }
        throw new BusinessException("Tipo de ajuste no soportado: " + adjustmentType);
    }

    public Map<String, Object> getSummary(UUID companyId) {
        Map<String, Object> summary = new HashMap<>();

        long totalProducts = productRepository.count();
        long outOfStock = productRepository.countOutOfStock(companyId);
        List<Product> lowStock = productRepository.findLowStockProducts(companyId);
        BigDecimal inventoryValue = productRepository.calculateInventoryValue(companyId);

        summary.put("totalProducts", totalProducts);
        summary.put("outOfStock", outOfStock);
        summary.put("criticalStock", (long) lowStock.size());
        summary.put("inventoryValue", inventoryValue != null ? inventoryValue : BigDecimal.ZERO);

        return summary;
    }
}
