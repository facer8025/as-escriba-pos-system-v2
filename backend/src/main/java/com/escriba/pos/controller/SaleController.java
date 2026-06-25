package com.escriba.pos.controller;

import com.escriba.pos.dto.request.CreateSaleRequest;
import com.escriba.pos.dto.response.ApiResponse;
import com.escriba.pos.model.entity.Sale;
import com.escriba.pos.model.entity.SaleItem;
import com.escriba.pos.model.entity.SalePayment;
import com.escriba.pos.repository.SaleRepository;
import com.escriba.pos.service.SaleService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/sales")
@RequiredArgsConstructor
public class SaleController {

    private final SaleRepository saleRepository;
    private final SaleService saleService;

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<Page<Sale>>> getSales(
            @RequestParam UUID companyId,
            @RequestParam(required = false) UUID customerId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {

        Page<Sale> sales = saleRepository.findByFilters(
                companyId, customerId, status,
                PageRequest.of(page, size, Sort.by("createdAt").descending()));

        return ResponseEntity.ok(ApiResponse.success(sales));
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<Map<String, Object>>> getById(@PathVariable UUID id) {
        Sale sale = saleRepository.findById(id).orElse(null);
        if (sale == null) {
            return ResponseEntity.ok(ApiResponse.success(null));
        }

        Map<String, Object> result = buildSaleMap(sale);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/session/{sessionId}")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getBySession(
            @PathVariable UUID sessionId) {
        List<Sale> sales = saleRepository.findBySessionId(sessionId);
        List<Map<String, Object>> result = sales.stream()
                .map(this::buildSaleMap)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('AD', 'CA', 'VE')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createSale(@RequestBody CreateSaleRequest request) {
        Sale saved = saleService.createSale(request);
        Map<String, Object> result = new HashMap<>();
        result.put("id", saved.getId().toString());
        result.put("saleNumber", saved.getSaleNumber());
        result.put("total", saved.getTotal());
        result.put("status", saved.getStatus().name());
        return ResponseEntity.ok(ApiResponse.success("Venta registrada exitosamente", result));
    }

    /**
     * Construye un Map plano a partir de la entidad Sale, incluyendo items y pagos
     * sin problemas de lazy loading ni serialización circular.
     */
    private Map<String, Object> buildSaleMap(Sale sale) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", sale.getId().toString());
        map.put("saleNumber", sale.getSaleNumber());
        map.put("documentType", sale.getDocumentType());
        map.put("subtotal", sale.getSubtotal());
        map.put("discountTotal", sale.getDiscountTotal());
        map.put("taxTotal", sale.getTaxTotal());
        map.put("total", sale.getTotal());
        map.put("status", sale.getStatus() != null ? sale.getStatus().name() : null);
        map.put("createdAt", sale.getCreatedAt() != null ? sale.getCreatedAt().toString() : null);

        // Customer
        if (sale.getCustomer() != null) {
            Map<String, Object> cust = new HashMap<>();
            cust.put("name", sale.getCustomer().getName());
            cust.put("documentNumber", sale.getCustomer().getDocumentNumber());
            map.put("customer", cust);
        }

        // Items (con producto, cantidad, precios, IVA)
        List<Map<String, Object>> itemsList = new ArrayList<>();
        for (SaleItem item : sale.getItems()) {
            Map<String, Object> itemMap = new LinkedHashMap<>();
            itemMap.put("id", item.getId().toString());
            itemMap.put("quantity", item.getQuantity());
            itemMap.put("unitPrice", item.getUnitPrice());
            itemMap.put("discountType", item.getDiscountType());
            itemMap.put("discountValue", item.getDiscountValue());
            itemMap.put("discountAmount", item.getDiscountAmount());
            itemMap.put("taxRate", item.getTaxRate());
            itemMap.put("taxAmount", item.getTaxAmount());
            itemMap.put("subtotal", item.getSubtotal());
            itemMap.put("total", item.getTotal());

            if (item.getProduct() != null) {
                Map<String, Object> prod = new HashMap<>();
                prod.put("id", item.getProduct().getId().toString());
                prod.put("name", item.getProduct().getName());
                prod.put("internalCode", item.getProduct().getInternalCode());
                itemMap.put("product", prod);
            }

            itemsList.add(itemMap);
        }
        map.put("items", itemsList);

        // Payments
        List<Map<String, Object>> paymentsList = new ArrayList<>();
        for (SalePayment payment : sale.getPayments()) {
            Map<String, Object> payMap = new LinkedHashMap<>();
            payMap.put("id", payment.getId().toString());
            payMap.put("amount", payment.getAmount());
            payMap.put("reference", payment.getReference());

            if (payment.getPaymentMethod() != null) {
                Map<String, Object> pm = new HashMap<>();
                pm.put("name", payment.getPaymentMethod().getName());
                payMap.put("paymentMethod", pm);
            }

            paymentsList.add(payMap);
        }
        map.put("payments", paymentsList);

        return map;
    }
}
