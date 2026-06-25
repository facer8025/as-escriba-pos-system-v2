package com.escriba.pos.controller;

import com.escriba.pos.dto.response.ApiResponse;
import com.escriba.pos.service.ProductService;
import com.escriba.pos.repository.SaleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final SaleRepository saleRepository;
    private final ProductService productService;

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboardSummary(
            @RequestParam UUID companyId) {

        Map<String, Object> summary = new HashMap<>();

        // Today's sales
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        LocalDateTime todayEnd = LocalDate.now().atTime(LocalTime.MAX);
        BigDecimal todaySales = saleRepository.sumTotalByCompanyAndDateBetween(
                companyId, todayStart, todayEnd);
        long todayTransactions = saleRepository.countByCompanyIdAndCreatedAtBetween(
                companyId, todayStart, todayEnd);

        // Yesterday's sales
        LocalDateTime yesterdayStart = LocalDate.now().minusDays(1).atStartOfDay();
        LocalDateTime yesterdayEnd = LocalDate.now().minusDays(1).atTime(LocalTime.MAX);
        BigDecimal yesterdaySales = saleRepository.sumTotalByCompanyAndDateBetween(
                companyId, yesterdayStart, yesterdayEnd);

        // Compare with yesterday
        double trend = yesterdaySales.compareTo(BigDecimal.ZERO) > 0
                ? ((todaySales.doubleValue() - yesterdaySales.doubleValue()) / yesterdaySales.doubleValue()) * 100
                : 0;

        // Inventory metrics
        long outOfStock = productService.countOutOfStock(companyId);
        BigDecimal inventoryValue = productService.getInventoryValue(companyId);

        summary.put("todaySales", todaySales);
        summary.put("todayTransactions", todayTransactions);
        summary.put("yesterdaySales", yesterdaySales);
        summary.put("salesTrend", Math.round(trend * 10.0) / 10.0);
        summary.put("outOfStock", outOfStock);
        summary.put("inventoryValue", inventoryValue);

        return ResponseEntity.ok(ApiResponse.success(summary));
    }
}
