package com.escriba.pos.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class LoginRequest {

    @NotBlank(message = "El usuario o correo es requerido")
    @Size(min = 3, message = "Mínimo 3 caracteres")
    private String usernameOrEmail;

    @NotBlank(message = "La contraseña es requerida")
    @Size(min = 8, message = "Mínimo 8 caracteres")
    private String password;

    private boolean rememberMe;
}
