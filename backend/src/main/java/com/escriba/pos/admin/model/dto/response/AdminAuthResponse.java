package com.escriba.pos.admin.model.dto.response;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import java.util.UUID;

@Data @Builder @AllArgsConstructor
public class AdminAuthResponse {
    private String accessToken;
    private String refreshToken;
    private String tempToken;
    private boolean totpRequired;
    private AdminUserResponse user;
}
