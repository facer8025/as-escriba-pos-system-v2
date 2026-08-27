package com.escriba.pos.admin.model.dto.request;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class CreateTenantRequest {
    @NotBlank private String personType;
    @NotBlank @Size(min = 9, max = 20) private String nit;
    private String dv;
    @NotBlank private String businessName;
    private String tradeName;
    @NotBlank private String taxRegime;
    private String ciiuCode;
    private String address;
    @NotBlank private String department;
    @NotBlank private String city;
    private String phone;
    @NotBlank @Email private String email;
    private String website;
    @NotBlank private String adminFirstName;
    @NotBlank private String adminLastName;
    @NotBlank @Email private String adminEmail;
    private String adminPhone;
    @Size(min = 8, max = 72, message = "La contraseña del admin debe tener entre 8 y 72 caracteres")
    private String adminPassword;
    @NotNull private Integer planId;
    @NotBlank private String licenseType;
    @NotNull private LocalDate licenseStartDate;
    @NotNull private Integer licenseDuration; // en meses
    private boolean autoRenew = true;
    private int gracePeriodDays = 7;
    @DecimalMin("0") @DecimalMax("100") private BigDecimal discountPct = BigDecimal.ZERO;
    private String discountReason;
    private String notes;
    private String timezone = "America/Bogota";
    private java.util.List<String> initialModules;
}
