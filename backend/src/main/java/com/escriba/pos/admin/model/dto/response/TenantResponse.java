package com.escriba.pos.admin.model.dto.response;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data @Builder @AllArgsConstructor
public class TenantResponse {
    private UUID id;
    private String nit;
    private String dv;
    private String businessName;
    private String tradeName;
    private String taxRegime;
    private String ciiuCode;
    private String city;
    private String department;
    private String phone;
    private String email;
    private String logoUrl;
    private String status;
    private String schemaName;
    private String timezone;
    private LocalDateTime registeredAt;
    private LocalDateTime activatedAt;
    private LocalDateTime suspendedAt;
    private LocalDateTime cancelledAt;
    private String suspensionReason;
    private String planName;
    private String licenseStatus;
    private LocalDateTime licenseExpiresAt;
}
