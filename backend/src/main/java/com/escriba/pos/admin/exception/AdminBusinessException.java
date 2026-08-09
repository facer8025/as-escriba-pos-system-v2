package com.escriba.pos.admin.exception;

/**
 * Excepción de negocio para el módulo administrativo.
 * Reemplaza RuntimeException para errores de dominio.
 */
public class AdminBusinessException extends RuntimeException {
    private final String code;

    public AdminBusinessException(String message) {
        super(message);
        this.code = "ADMIN_ERROR";
    }

    public AdminBusinessException(String code, String message) {
        super(message);
        this.code = code;
    }

    public String getCode() { return code; }

    // Códigos de error predefinidos
    public static final String NOT_FOUND = "NOT_FOUND";
    public static final String DUPLICATE = "DUPLICATE";
    public static final String INVALID_STATE = "INVALID_STATE";
    public static final String VALIDATION = "VALIDATION";
    public static final String FORBIDDEN = "FORBIDDEN";
}
