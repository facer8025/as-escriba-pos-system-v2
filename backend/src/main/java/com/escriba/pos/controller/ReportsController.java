package com.escriba.pos.controller;

import com.escriba.pos.dto.response.ApiResponse;
import com.escriba.pos.model.entity.Sale;
import com.escriba.pos.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
public class ReportsController {

    private final SaleRepository saleRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final SupplierRepository supplierRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;

    @GetMapping("/sales")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSalesReport(
            @RequestParam UUID companyId,
            @RequestParam(required = false) LocalDate dateFrom,
            @RequestParam(required = false) LocalDate dateTo) {

        LocalDateTime from = dateFrom != null ? dateFrom.atStartOfDay() : LocalDate.now().minusDays(30).atStartOfDay();
        LocalDateTime to = dateTo != null ? dateTo.atTime(LocalTime.MAX) : LocalDate.now().atTime(LocalTime.MAX);

        BigDecimal totalSales = saleRepository.sumTotalByCompanyAndDateBetween(companyId, from, to);
        long totalTransactions = saleRepository.countByCompanyIdAndCreatedAtBetween(companyId, from, to);

        // Daily breakdown — single query instead of 60 individual queries
        List<Object[]> dailyRaw = saleRepository.sumTotalGroupedByDay(companyId, from, to);
        List<Map<String, Object>> dailySales = new ArrayList<>();
        for (Object[] row : dailyRaw) {
            Map<String, Object> day = new HashMap<>();
            day.put("date", row[0] != null ? row[0].toString() : "");
            day.put("total", row[1] != null ? row[1] : BigDecimal.ZERO);
            day.put("transactions", row[2] != null ? row[2] : 0L);
            dailySales.add(day);
        }

        // Recent sales — build flat maps to avoid LazyInitializationException
        List<Sale> recentSalesEntities = saleRepository.findByFilters(
                companyId, null, null,
                PageRequest.of(0, 10, Sort.by("createdAt").descending())).getContent();

        List<Map<String, Object>> recentSales = new ArrayList<>();
        for (Sale s : recentSalesEntities) {
            Map<String, Object> sm = new LinkedHashMap<>();
            sm.put("id", s.getId().toString());
            sm.put("saleNumber", s.getSaleNumber());
            sm.put("subtotal", s.getSubtotal());
            sm.put("taxTotal", s.getTaxTotal());
            sm.put("total", s.getTotal());
            sm.put("createdAt", s.getCreatedAt() != null ? s.getCreatedAt().toString() : null);
            if (s.getCustomer() != null) {
                Map<String, Object> c = new HashMap<>();
                c.put("name", s.getCustomer().getName());
                sm.put("customer", c);
            }
            recentSales.add(sm);
        }

        Map<String, Object> report = new LinkedHashMap<>();
        report.put("totalSales", totalSales != null ? totalSales : BigDecimal.ZERO);
        report.put("totalTransactions", totalTransactions);
        report.put("averageTicket", totalTransactions > 0
                ? totalSales.divide(BigDecimal.valueOf(totalTransactions), 2, java.math.RoundingMode.HALF_UP)
                : BigDecimal.ZERO);
        report.put("periodFrom", from.toString());
        report.put("periodTo", to.toString());
        report.put("dailyBreakdown", dailySales);
        report.put("recentSales", recentSales);

        return ResponseEntity.ok(ApiResponse.success(report));
    }

    @GetMapping("/inventory")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getInventoryReport(
            @RequestParam UUID companyId) {

        long totalProducts = productRepository.count();
        long outOfStock = productRepository.countOutOfStock(companyId);
        BigDecimal inventoryValue = productRepository.calculateInventoryValue(companyId);
        List<?> lowStock = productRepository.findLowStockProducts(companyId);

        Map<String, Object> report = new LinkedHashMap<>();
        report.put("totalProducts", totalProducts);
        report.put("outOfStock", outOfStock);
        report.put("inStock", totalProducts - outOfStock);
        report.put("inventoryValue", inventoryValue != null ? inventoryValue : BigDecimal.ZERO);
        report.put("lowStockCount", (long) lowStock.size());
        report.put("asOf", LocalDateTime.now().toString());

        return ResponseEntity.ok(ApiResponse.success(report));
    }

    @GetMapping("/general")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getGeneralReport(
            @RequestParam UUID companyId) {

        BigDecimal totalSales = saleRepository.sumTotalByCompanyAndDateBetween(
                companyId, LocalDate.now().atStartOfDay(), LocalDate.now().atTime(LocalTime.MAX));
        long todayTransactions = saleRepository.countByCompanyIdAndCreatedAtBetween(
                companyId, LocalDate.now().atStartOfDay(), LocalDate.now().atTime(LocalTime.MAX));
        long totalCustomers = customerRepository.countByCompanyId(companyId);
        long totalSuppliers = supplierRepository.countByCompanyId(companyId);
        long activeOrders = purchaseOrderRepository.countByCompanyIdAndStatusIn(
                companyId, List.of("SENT", "CONFIRMED", "IN_TRANSIT"));
        BigDecimal inventoryValue = productRepository.calculateInventoryValue(companyId);

        Map<String, Object> report = new LinkedHashMap<>();
        report.put("todaySales", totalSales != null ? totalSales : BigDecimal.ZERO);
        report.put("todayTransactions", todayTransactions);
        report.put("totalCustomers", totalCustomers);
        report.put("totalSuppliers", totalSuppliers);
        report.put("activeOrders", activeOrders);
        report.put("inventoryValue", inventoryValue != null ? inventoryValue : BigDecimal.ZERO);

        return ResponseEntity.ok(ApiResponse.success(report));
    }
}
