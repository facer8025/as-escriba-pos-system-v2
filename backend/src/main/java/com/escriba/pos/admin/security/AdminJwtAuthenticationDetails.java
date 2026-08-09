package com.escriba.pos.admin.security;

import java.util.UUID;

public class AdminJwtAuthenticationDetails {
    private final UUID adminUserId;
    private final String role;
    private final String tokenType;

    public AdminJwtAuthenticationDetails(UUID adminUserId, String role, String tokenType) {
        this.adminUserId = adminUserId;
        this.role = role;
        this.tokenType = tokenType;
    }

    public UUID getAdminUserId() { return adminUserId; }
    public String getRole() { return role; }
    public String getTokenType() { return tokenType; }
}
