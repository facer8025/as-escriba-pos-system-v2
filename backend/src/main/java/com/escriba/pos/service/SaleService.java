package com.escriba.pos.service;

import com.escriba.pos.dto.request.CreateSaleRequest;
import com.escriba.pos.exception.BusinessException;
import com.escriba.pos.model.entity.*;
import com.escriba.pos.model.enums.MovementType;
import com.escriba.pos.model.enums.SaleStatus;
import com.escriba.pos.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SaleService {

    private final SaleRepository saleRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final CompanyRepository companyRepository;
    private final BranchRepository branchRepository;
    private final UserRepository userRepository;
    private final CashSessionRepository cashSessionRepository;
    private final PaymentMethodRepository paymentMethodRepository;
    private final InventoryMovementRepository movementRepository;
    private final NotificationService notificationService;

    @Transactional
    public Sale createSale(CreateSaleRequest request) {
        // 1. Validar entidades base
        Company company = companyRepository.findById(request.getCompanyId())
                .orElseThrow(() -> new BusinessException("Empresa no encontrada"));

        User seller = userRepository.findById(request.getSellerId())
                .orElseThrow(() -> new BusinessException("Vendedor no encontrado"));

        // 2. Validar y descontar stock de cada producto
        for (CreateSaleRequest.SaleItemRequest itemReq : request.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new BusinessException("Producto no encontrado: " + itemReq.getProductId()));

            if (product.getManageInventory() != null && product.getManageInventory()) {
                BigDecimal currentStock = product.getCurrentStock() != null ? product.getCurrentStock() : BigDecimal.ZERO;
                if (currentStock.compareTo(itemReq.getQuantity()) < 0) {
                    throw new BusinessException(
                            "Stock insuficiente para " + product.getName() +
                            ". Disponible: " + currentStock + ", solicitado: " + itemReq.getQuantity());
                }
            }
        }

        // 3. Generar número de venta
        String saleNumber = generateSaleNumber(request.getCompanyId());

        // 4. Construir la venta
        Sale sale = Sale.builder()
                .company(company)
                .saleNumber(saleNumber)
                .subtotal(BigDecimal.ZERO)
                .discountType(request.getDiscountType())
                .discountValue(request.getDiscountValue() != null ? request.getDiscountValue() : BigDecimal.ZERO)
                .discountTotal(BigDecimal.ZERO)
                .taxTotal(BigDecimal.ZERO)
                .total(BigDecimal.ZERO)
                .status(SaleStatus.COMPLETED)
                .documentType(request.getDocumentType() != null ? request.getDocumentType() : "TICKET")
                .notes(request.getNotes())
                .items(new ArrayList<>())
                .payments(new ArrayList<>())
                .build();

        // Asignar relaciones opcionales
        if (request.getBranchId() != null) {
            branchRepository.findById(request.getBranchId()).ifPresent(sale::setBranch);
        }
        if (request.getCustomerId() != null) {
            customerRepository.findById(request.getCustomerId()).ifPresent(sale::setCustomer);
        }
        if (request.getSessionId() != null) {
            cashSessionRepository.findById(request.getSessionId()).ifPresent(sale::setSession);
        }
        sale.setSeller(seller);

        // 5. Procesar ítems y actualizar stock
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal discountTotal = BigDecimal.ZERO;
        BigDecimal taxTotal = BigDecimal.ZERO;

        for (CreateSaleRequest.SaleItemRequest itemReq : request.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new BusinessException("Producto no encontrado: " + itemReq.getProductId()));

            BigDecimal itemSubtotal = itemReq.getSubtotal() != null ? itemReq.getSubtotal() :
                    itemReq.getUnitPrice().multiply(itemReq.getQuantity());
            BigDecimal itemDiscount = itemReq.getDiscountAmount() != null ? itemReq.getDiscountAmount() : BigDecimal.ZERO;
            BigDecimal itemTax = itemReq.getTaxAmount() != null ? itemReq.getTaxAmount() : BigDecimal.ZERO;
            BigDecimal itemTotal = itemReq.getTotal() != null ? itemReq.getTotal() :
                    itemSubtotal.subtract(itemDiscount).add(itemTax);

            SaleItem saleItem = SaleItem.builder()
                    .sale(sale)
                    .product(product)
                    .quantity(itemReq.getQuantity())
                    .unitPrice(itemReq.getUnitPrice())
                    .discountType(itemReq.getDiscountType())
                    .discountValue(itemReq.getDiscountValue() != null ? itemReq.getDiscountValue() : BigDecimal.ZERO)
                    .discountAmount(itemDiscount)
                    .taxRate(itemReq.getTaxRate() != null ? itemReq.getTaxRate() : BigDecimal.ZERO)
                    .taxAmount(itemTax)
                    .subtotal(itemSubtotal)
                    .total(itemTotal)
                    .notes(itemReq.getNotes())
                    .build();

            sale.getItems().add(saleItem);

            subtotal = subtotal.add(itemSubtotal);
            discountTotal = discountTotal.add(itemDiscount);
            taxTotal = taxTotal.add(itemTax);

            // 5b. Descontar stock inmediatamente (movimientos se registran tras guardar la venta)
            if (product.getManageInventory() != null && product.getManageInventory()) {
                BigDecimal stockBefore = product.getCurrentStock() != null ? product.getCurrentStock() : BigDecimal.ZERO;
                BigDecimal stockAfter = stockBefore.subtract(itemReq.getQuantity());
                product.setCurrentStock(stockAfter);
                productRepository.save(product);

                // Notificar si el producto quedó sin stock o bajo mínimo
                notificationService.checkAndNotifyStockAlerts(product, request.getCompanyId());
            }
        }

        // 6. Procesar pagos
        for (CreateSaleRequest.SalePaymentRequest payReq : request.getPayments()) {
            PaymentMethod method = paymentMethodRepository.findByCode(payReq.getPaymentMethodCode())
                    .orElseThrow(() -> new BusinessException("Medio de pago no encontrado: " + payReq.getPaymentMethodCode()));

            SalePayment payment = SalePayment.builder()
                    .sale(sale)
                    .paymentMethod(method)
                    .reference(payReq.getReference())
                    .amount(payReq.getAmount())
                    .changeAmount(BigDecimal.ZERO)
                    .build();

            sale.getPayments().add(payment);
        }

        // 7. Calcular totales finales
        BigDecimal globalDiscount = BigDecimal.ZERO;
        if (request.getDiscountValue() != null && request.getDiscountValue().compareTo(BigDecimal.ZERO) > 0) {
            if ("%".equals(request.getDiscountType())) {
                globalDiscount = subtotal.multiply(request.getDiscountValue()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            } else {
                globalDiscount = request.getDiscountValue().min(subtotal);
            }
        }

        sale.setSubtotal(subtotal);
        sale.setDiscountTotal(discountTotal.add(globalDiscount));
        sale.setTaxTotal(taxTotal);
        sale.setTotal(subtotal.subtract(discountTotal).subtract(globalDiscount).add(taxTotal));

        // 8. Guardar venta completa (cascade persiste items y payments)
        Sale saved = saleRepository.save(sale);

        // 9. Registrar movimientos de inventario (kardex) con el ID de la venta
        for (CreateSaleRequest.SaleItemRequest itemReq : request.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new BusinessException("Producto no encontrado: " + itemReq.getProductId()));

            if (product.getManageInventory() != null && product.getManageInventory()) {
                BigDecimal stockBefore = (product.getCurrentStock() != null ? product.getCurrentStock() : BigDecimal.ZERO)
                        .add(itemReq.getQuantity()); // stock antes de descontar
                BigDecimal stockAfter = stockBefore.subtract(itemReq.getQuantity());

                InventoryMovement movement = InventoryMovement.builder()
                        .company(company)
                        .product(product)
                        .movementType(MovementType.SALE)
                        .referenceType("SALE")
                        .referenceId(saved.getId())
                        .quantity(itemReq.getQuantity().negate())
                        .unitCost(product.getAvgCost() != null ? product.getAvgCost() : BigDecimal.ZERO)
                        .stockBefore(stockBefore)
                        .stockAfter(product.getCurrentStock())
                        .createdBy(seller)
                        .build();

                movementRepository.save(movement);
            }
        }

        // 10. Actualizar compras del cliente si aplica
        if (request.getCustomerId() != null) {
            customerRepository.findById(request.getCustomerId()).ifPresent(customer -> {
                customer.setTotalPurchases(
                        (customer.getTotalPurchases() != null ? customer.getTotalPurchases() : BigDecimal.ZERO)
                                .add(saved.getTotal()));
                customer.setLastPurchaseAt(LocalDateTime.now());
                customerRepository.save(customer);
            });
        }

        return saved;
    }

    private String generateSaleNumber(UUID companyId) {
        // Formato: F-{YYYYMMDD}-{NNNN}
        String datePart = java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd"));
        String prefix = "F-" + datePart + "-";

        // Buscar el último número de venta del día para incrementar
        Long lastNumber = saleRepository.countByCompanyIdAndSaleNumberStartingWith(companyId, prefix);

        return prefix + String.format("%04d", (lastNumber != null ? lastNumber : 0) + 1);
    }
}
