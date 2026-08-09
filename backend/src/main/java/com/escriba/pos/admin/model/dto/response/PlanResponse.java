package com.escriba.pos.admin.model.dto.response;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
public class PlanResponse {
    private Integer id;
    private String name;
    private String slug;
    private String descriptionShort;
    private BigDecimal priceMonthly;
    private BigDecimal priceAnnual;
    private BigDecimal taxRate;
    private BigDecimal annualDiscountPct;
    private int trialDays;
    private String badgeColor;
    private boolean isFeatured;
    private boolean isVisibleWeb;
    private String status;
    private Integer maxUsers;
    private Integer maxBranches;
    private Integer maxProducts;
    private Integer maxMonthlyInvoices;
    private Integer storageGb;
    private String supportLevel;
    private long activeCompanies;
    private List<PlanModuleResponse> modules;
    private LocalDateTime createdAt;
}
