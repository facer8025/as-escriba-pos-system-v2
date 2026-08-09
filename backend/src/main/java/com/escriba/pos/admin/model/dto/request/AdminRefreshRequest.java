package com.escriba.pos.admin.model.dto.request;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AdminRefreshRequest {
    @NotBlank
    private String refreshToken;
}
