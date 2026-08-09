package com.escriba.pos.admin.model.dto.request;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class CreatePlanRequest {
    @NotBlank private String name;
    private String descriptionShort;
    private String descriptionLong;
    @NotNull @DecimalMin("0") private BigDecimal priceMonthly;
    @NotNull @DecimalMin("0") private BigDecimal priceAnnual;
    private String badgeColor = "#4f46e5";
    private boolean isFeatured;
    private boolean isVisibleWeb = true;
    private int trialDays;
    private Integer maxUsers;
    private Integer maxBranches;
    private Integer maxProducts;
    private Integer maxMonthlyInvoices;
    private Integer storageGb;
    private String supportLevel;
    @NotEmpty private List<String> modules;
}
