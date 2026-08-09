package com.escriba.pos.admin.model.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class PaymentGatewayDTO {
    private Integer id;
    private String name;
    private String code;
    private String commissionPct;
    private Boolean active;
}
