package com.escriba.pos.admin.model.dto.request;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AdminLoginRequest {
    @NotBlank @Email
    private String email;
    @NotBlank @Size(min = 12)
    private String password;
}
