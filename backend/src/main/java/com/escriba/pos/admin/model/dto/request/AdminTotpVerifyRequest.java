package com.escriba.pos.admin.model.dto.request;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AdminTotpVerifyRequest {
    @NotBlank
    private String tempToken;
    @NotBlank @Size(min = 6, max = 6)
    private String code;
}
