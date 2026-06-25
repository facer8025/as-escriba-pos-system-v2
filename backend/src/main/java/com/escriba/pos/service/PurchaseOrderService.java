package com.escriba.pos.service;

import com.escriba.pos.exception.BusinessException;
import com.escriba.pos.model.entity.*;
import com.escriba.pos.model.enums.MovementType;
import com.escriba.pos.model.enums.OrderStatus;
import com.escriba.pos.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PurchaseOrderService {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;
    private final InventoryMovementRepository movementRepository;
    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;

    @Transactional
    public PurchaseOrder createOrder(PurchaseOrder order) {
        order.setOrderNumber(generateOrderNumber(order.getCompany().getId()));
        order.setStatus(OrderStatus.DRAFT);
        order.setCreatedAt(LocalDateTime.now());
        
        // Calculate totals
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal discountTotal = BigDecimal.ZERO;
        BigDecimal taxTotal = BigDecimal.ZERO;
        
        for (PurchaseOrderItem item : order.getItems()) {
            item.setPurchaseOrder(order);
            BigDecimal lineSubtotal = item.getUnitCost().multiply(item.getQuantity());
            BigDecimal lineDiscount = BigDecimal.ZERO;
            if (item.getDiscountPct() != null && item.getDiscountPct().compareTo(BigDecimal.ZERO) > 0) {
                lineDiscount = lineSubtotal.multiply(item.getDiscountPct().divide(BigDecimal.valueOf(100)));
            }
            BigDecimal lineTax = BigDecimal.ZERO;
            if (item.getVatRate() != null && item.getVatRate().compareTo(BigDecimal.ZERO) > 0) {
                lineTax = lineSubtotal.subtract(lineDiscount)
                        .multiply(item.getVatRate().divide(BigDecimal.valueOf(100)));
            }
            item.setSubtotal(lineSubtotal.subtract(lineDiscount));
            item.setTaxAmount(lineTax);
            item.setTotal(lineSubtotal.subtract(lineDiscount).add(lineTax));
            
            subtotal = subtotal.add(lineSubtotal);
            discountTotal = discountTotal.add(lineDiscount);
            taxTotal = taxTotal.add(lineTax);
        }
        
        order.setSubtotal(subtotal);
        order.setDiscountTotal(discountTotal);
        order.setTaxTotal(taxTotal);
        order.setTotal(subtotal.subtract(discountTotal).add(taxTotal));
        
        return purchaseOrderRepository.save(order);
    }

    @Transactional
    public PurchaseOrder sendOrder(UUID orderId, UUID userId) {
        PurchaseOrder order = purchaseOrderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException("Orden no encontrada"));
        if (order.getStatus() != OrderStatus.DRAFT) {
            throw new BusinessException("Solo las órdenes en borrador pueden enviarse");
        }
        order.setStatus(OrderStatus.SENT);
        order.setSentAt(LocalDateTime.now());
        return purchaseOrderRepository.save(order);
    }

    @Transactional
    public PurchaseOrder receiveOrder(UUID orderId, UUID userId, UUID warehouseId) {
        PurchaseOrder order = purchaseOrderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException("Orden no encontrada"));
        if (order.getStatus() != OrderStatus.SENT && order.getStatus() != OrderStatus.CONFIRMED) {
            throw new BusinessException("La orden debe estar en estado Enviada o Confirmada para recibir");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("Usuario no encontrado"));
        Warehouse warehouse = warehouseRepository.findById(warehouseId)
                .orElseThrow(() -> new BusinessException("Bodega no encontrada"));
        Company company = companyRepository.findById(order.getCompany().getId())
                .orElseThrow(() -> new BusinessException("Empresa no encontrada"));

        boolean allReceived = true;
        for (PurchaseOrderItem item : order.getItems()) {
            BigDecimal qtyReceived = item.getQuantityReceived() != null ? item.getQuantityReceived() : BigDecimal.ZERO;
            BigDecimal pending = item.getQuantity().subtract(qtyReceived);
            
            if (pending.compareTo(BigDecimal.ZERO) > 0) {
                // Update product stock
                Product product = item.getProduct();
                BigDecimal stockBefore = product.getCurrentStock() != null ? product.getCurrentStock() : BigDecimal.ZERO;
                BigDecimal stockAfter = stockBefore.add(pending);
                
                // Update average cost
                BigDecimal newAvgCost;
                if (stockBefore.compareTo(BigDecimal.ZERO) == 0) {
                    newAvgCost = item.getUnitCost();
                } else {
                    BigDecimal currentValue = stockBefore.multiply(product.getAvgCost());
                    BigDecimal newValue = pending.multiply(item.getUnitCost());
                    newAvgCost = currentValue.add(newValue).divide(stockAfter, 2, java.math.RoundingMode.HALF_UP);
                }
                
                product.setCurrentStock(stockAfter);
                product.setAvgCost(newAvgCost);
                productRepository.save(product);

                // Create inventory movement
                InventoryMovement movement = InventoryMovement.builder()
                        .company(company)
                        .product(product)
                        .warehouse(warehouse)
                        .movementType(MovementType.PURCHASE_ENTRY)
                        .referenceType("PURCHASE_ORDER")
                        .referenceId(orderId)
                        .quantity(pending)
                        .unitCost(item.getUnitCost())
                        .stockBefore(stockBefore)
                        .stockAfter(stockAfter)
                        .createdBy(user)
                        .build();
                movementRepository.save(movement);

                item.setQuantityReceived(qtyReceived.add(pending));
            }
            
            if (item.getQuantityReceived().compareTo(item.getQuantity()) < 0) {
                allReceived = false;
            }
        }

        order.setStatus(allReceived ? OrderStatus.RECEIVED : OrderStatus.PARTIALLY_RECEIVED);
        order.setReceivedAt(LocalDateTime.now());
        return purchaseOrderRepository.save(order);
    }

    @Transactional
    public PurchaseOrder cancelOrder(UUID orderId) {
        PurchaseOrder order = purchaseOrderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException("Orden no encontrada"));
        if (order.getStatus() == OrderStatus.RECEIVED) {
            throw new BusinessException("No se puede cancelar una orden ya recibida");
        }
        order.setStatus(OrderStatus.CANCELLED);
        return purchaseOrderRepository.save(order);
    }

    @Transactional
    public PurchaseOrder advanceStatus(UUID orderId, OrderStatus newStatus) {
        PurchaseOrder order = purchaseOrderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException("Orden no encontrada"));
        order.setStatus(newStatus);
        return purchaseOrderRepository.save(order);
    }

    private String generateOrderNumber(UUID companyId) {
        return "PO-" + LocalDateTime.now().getYear() + "-" + 
               String.format("%06d", purchaseOrderRepository.count() + 1);
    }
}
