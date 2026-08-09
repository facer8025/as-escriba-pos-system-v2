package com.escriba.pos.admin.model.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class SystemConfigResponse {
    private Map<String, String> configs;
    private List<DianProviderDTO> dianProviders;
    private List<PaymentGatewayDTO> paymentGateways;
}
