package com.escriba.pos.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
public class AuthResponse {
    private UUID userId;
    private String email;
    private String fullName;
    private String role;
    private String roleName;
    private String avatarUrl;
    private UUID companyId;
    private String companyName;
    private UUID branchId;
    private String branchName;
    private String accessToken;
    private String refreshToken;
    private String tokenType;
    private boolean mustChangePassword;
    private long expiresIn;
}
