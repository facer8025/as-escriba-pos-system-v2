package com.escriba.pos.admin.model.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AdminUpdateProfileRequest {
    @NotBlank(message = "El nombre es requerido")
    @Size(max = 100)
    private String firstName;

    @NotBlank(message = "Los apellidos son requeridos")
    @Size(max = 100)
    private String lastName;

    @Size(max = 30)
    private String phone;

    @Size(max = 100)
    private String position;
}