package com.escriba.pos.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.UUID;

@Data
public class RegisterUserRequest {

    @NotBlank(message = "Los nombres son requeridos")
    @Size(min = 2, max = 60, message = "Los nombres deben tener entre 2 y 60 caracteres")
    private String firstName;

    @NotBlank(message = "Los apellidos son requeridos")
    @Size(min = 2, max = 60, message = "Los apellidos deben tener entre 2 y 60 caracteres")
    private String lastName;

    @NotBlank(message = "El correo es requerido")
    @Email(message = "Formato de correo inválido")
    private String email;

    @NotBlank(message = "La contraseña es requerida")
    @Size(min = 8, message = "La contraseña debe tener mínimo 8 caracteres")
    private String password;

    private String phone;

    private Short roleId;

    private UUID branchId;

    private UUID companyId;
}
