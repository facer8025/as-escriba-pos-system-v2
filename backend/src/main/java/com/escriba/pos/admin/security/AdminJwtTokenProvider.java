package com.escriba.pos.admin.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

/**
 * Proveedor JWT para el panel administrativo.
 * Usa una clave SECRET_KEY separada del JWT del panel cliente.
 * En producción debe configurarse RS256 con un par de llaves.
 */
@Component
@Slf4j
public class AdminJwtTokenProvider {

    private final SecretKey secretKey;
    private final long accessTokenExpirationMs;
    private final long refreshTokenExpirationMs;
    private final long impersonationExpirationMs;

    // Tamaño mínimo seguro para HMAC: jjwt 0.12+ requiere 384 bits (48 bytes) para HS384
    private static final int MIN_KEY_BYTES = 48;

    public AdminJwtTokenProvider(
            @Value("${app.admin.jwt.secret}") String secret,
            @Value("${app.admin.jwt.access-expiration-ms:14400000}") long accessExpirationMs,
            @Value("${app.admin.jwt.refresh-expiration-ms:28800000}") long refreshExpirationMs,
            @Value("${app.admin.jwt.impersonation-expiration-ms:7200000}") long impersonationExpirationMs) {

        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < MIN_KEY_BYTES) {
            log.warn("Admin JWT secret tiene {} bits. Se requieren al menos {} bits ({} bytes) para HS384. " +
                     "Usando clave derivada. Recomendación: usar una clave de al menos {} caracteres.",
                    keyBytes.length * 8, MIN_KEY_BYTES * 8, MIN_KEY_BYTES, MIN_KEY_BYTES);
            byte[] paddedKey = new byte[MIN_KEY_BYTES];
            System.arraycopy(keyBytes, 0, paddedKey, 0, Math.min(keyBytes.length, MIN_KEY_BYTES));
            this.secretKey = Keys.hmacShaKeyFor(paddedKey);
        } else {
            this.secretKey = Keys.hmacShaKeyFor(keyBytes);
        }

        this.accessTokenExpirationMs = accessExpirationMs;
        this.refreshTokenExpirationMs = refreshExpirationMs;
        this.impersonationExpirationMs = impersonationExpirationMs;
    }

    /** Genera access token para admin (4h por defecto) */
    public String generateAccessToken(UUID adminUserId, String email, String role) {
        Date now = new Date();
        return Jwts.builder()
                .subject(adminUserId.toString())
                .claim("email", email)
                .claim("role", role)
                .claim("type", "admin_access")
                .issuedAt(now)
                .expiration(new Date(now.getTime() + accessTokenExpirationMs))
                .signWith(secretKey)
                .compact();
    }

    /** Genera refresh token para admin (8h por defecto) */
    public String generateRefreshToken(UUID adminUserId) {
        Date now = new Date();
        return Jwts.builder()
                .subject(adminUserId.toString())
                .claim("type", "admin_refresh")
                .issuedAt(now)
                .expiration(new Date(now.getTime() + refreshTokenExpirationMs))
                .signWith(secretKey)
                .compact();
    }

    /** Genera token de impersonation (2h, no renovable) */
    public String generateImpersonationToken(UUID tenantUserId, UUID tenantId,
                                              UUID impersonatedBy, String reason) {
        Date now = new Date();
        return Jwts.builder()
                .subject(tenantUserId.toString())
                .claim("tenant_id", tenantId.toString())
                .claim("impersonated_by", impersonatedBy.toString())
                .claim("reason", reason)
                .claim("type", "impersonation")
                .issuedAt(now)
                .expiration(new Date(now.getTime() + impersonationExpirationMs))
                .signWith(secretKey)
                .compact();
    }

    public UUID getUserIdFromToken(String token) {
        return UUID.fromString(parseToken(token).getSubject());
    }

    public String getEmailFromToken(String token) {
        return parseToken(token).get("email", String.class);
    }

    public String getRoleFromToken(String token) {
        return parseToken(token).get("role", String.class);
    }

    public String getTokenType(String token) {
        return parseToken(token).get("type", String.class);
    }

    public boolean validateToken(String token) {
        try {
            if (token == null || token.isBlank()) return false;
            parseToken(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.error("Invalid admin JWT token: {}", e.getMessage());
            return false;
        }
    }

    private Claims parseToken(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
