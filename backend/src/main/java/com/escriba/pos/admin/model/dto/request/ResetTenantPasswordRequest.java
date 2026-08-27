package com.escriba.pos.admin.model.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Asignación de contraseña al usuario administrador de una empresa (tenant).
 * Si password es null/vacío, el backend genera una contraseña temporal segura.
 */
@Data
public class ResetTenantPasswordRequest {

    @Size(min = 8, max = 72, message = "La contraseña debe tener entre 8 y 72 caracteres")
    private String password;
}
