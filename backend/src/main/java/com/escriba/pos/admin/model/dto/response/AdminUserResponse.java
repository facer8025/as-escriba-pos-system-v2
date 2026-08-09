package com.escriba.pos.admin.model.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class AdminUserResponse {
    private UUID id;
    private String email;
    private String firstName;
    private String lastName;
    private String role;
    private String roleName;
    private String phone;
    private String position;
    private String status;
    private Boolean totpEnabled;
    private LocalDateTime lastLoginAt;
    private LocalDateTime createdAt;
}
