package com.escriba.pos.security.jwt;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.UUID;

@Data
@AllArgsConstructor
public class JwtAuthenticationDetails {
    private UUID userId;
    private String role;
}
