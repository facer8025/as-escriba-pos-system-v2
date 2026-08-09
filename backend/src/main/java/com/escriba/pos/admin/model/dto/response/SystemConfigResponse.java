package com.escriba.pos.admin.model.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class SystemConfigResponse {
    private java.util.Map<String, String> configs;
    private List<DianProviderDTO> dianProviders;
    private List<PaymentGatewayDTO> paymentGateways;
}

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class DianProviderDTO {
    private Integer id;
    private String name;
    private String apiUrl;
    private String authType;
    private Boolean active;
}

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class PaymentGatewayDTO {
    private Integer id;
    private String name;
    private String code;
    private String commissionPct;
    private Boolean active;
}
