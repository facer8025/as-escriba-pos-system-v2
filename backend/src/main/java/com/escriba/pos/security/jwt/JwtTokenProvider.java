package com.escriba.pos.security.jwt;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

@Component
@Slf4j
public class JwtTokenProvider {

    private final SecretKey secretKey;
    private final long expirationMs;
    private final long refreshExpirationMs;

    // Tamaño mínimo seguro: jjwt 0.12+ requiere 384 bits (48 bytes) para HS384
    private static final int MIN_KEY_BYTES = 48;

    public JwtTokenProvider(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-ms}") long expirationMs,
            @Value("${app.jwt.refresh-expiration-ms}") long refreshExpirationMs) {

        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < MIN_KEY_BYTES) {
            log.warn("JWT secret tiene {} bits. Se requieren al menos {} bits ({} bytes) para HS384. " +
                     "Usando clave derivada. Recomendación: usar una clave de al menos {} caracteres.",
                    keyBytes.length * 8, MIN_KEY_BYTES * 8, MIN_KEY_BYTES, MIN_KEY_BYTES);
            byte[] paddedKey = new byte[MIN_KEY_BYTES];
            System.arraycopy(keyBytes, 0, paddedKey, 0, Math.min(keyBytes.length, MIN_KEY_BYTES));
            this.secretKey = Keys.hmacShaKeyFor(paddedKey);
        } else {
            this.secretKey = Keys.hmacShaKeyFor(keyBytes);
        }

        this.expirationMs = expirationMs;
        this.refreshExpirationMs = refreshExpirationMs;
    }

    public String generateAccessToken(UUID userId, String email, String role) {
        Date now = new Date();
        return Jwts.builder()
                .subject(userId.toString())
                .claim("email", email)
                .claim("role", role)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expirationMs))
                .signWith(secretKey)
                .compact();
    }

    public String generateRefreshToken(UUID userId) {
        Date now = new Date();
        return Jwts.builder()
                .subject(userId.toString())
                .claim("type", "refresh")
                .issuedAt(now)
                .expiration(new Date(now.getTime() + refreshExpirationMs))
                .signWith(secretKey)
                .compact();
    }

    public UUID getUserIdFromToken(String token) {
        Claims claims = parseToken(token);
        return UUID.fromString(claims.getSubject());
    }

    public String getEmailFromToken(String token) {
        Claims claims = parseToken(token);
        return claims.get("email", String.class);
    }

    public String getRoleFromToken(String token) {
        Claims claims = parseToken(token);
        return claims.get("role", String.class);
    }

    public boolean validateToken(String token) {
        try {
            if (token == null || token.isBlank()) {
                return false;
            }
            parseToken(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.error("Invalid JWT token: {}", e.getMessage());
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
