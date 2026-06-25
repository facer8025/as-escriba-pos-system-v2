package com.escriba.pos.model.enums;

public enum UserRole {
    SA("Superadmin"),
    AD("Administrador"),
    CA("Cajero"),
    BO("Bodeguero"),
    VE("Vendedor");

    private final String displayName;

    UserRole(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
