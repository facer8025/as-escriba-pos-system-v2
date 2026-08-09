package com.escriba.pos.admin.model.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class CreateAdminUserRequest {
    private String email;
    private String firstName;
    private String lastName;
    private String phone;
    private String position;
    private String role;
    private String password;
    private String ipWhitelist;
}
