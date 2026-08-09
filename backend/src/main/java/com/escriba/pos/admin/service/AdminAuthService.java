package com.escriba.pos.admin.service;

import com.escriba.pos.admin.model.dto.request.AdminLoginRequest;
import com.escriba.pos.admin.model.dto.request.AdminTotpVerifyRequest;
import com.escriba.pos.admin.model.dto.response.AdminAuthResponse;
import com.escriba.pos.admin.model.dto.response.AdminUserResponse;
import com.escriba.pos.admin.model.entity.AdminRefreshToken;
import com.escriba.pos.admin.model.entity.AdminUser;
import com.escriba.pos.admin.repository.AdminRefreshTokenRepository;
import com.escriba.pos.admin.repository.AdminUserRepository;
import com.escriba.pos.admin.security.AdminJwtTokenProvider;
import dev.samstevens.totp.code.CodeGenerator;
import dev.samstevens.totp.code.DefaultCodeGenerator;
import dev.samstevens.totp.code.DefaultCodeVerifier;
import dev.samstevens.totp.time.SystemTimeProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminAuthService {

    private final AdminUserRepository adminUserRepository;
    private final AdminRefreshTokenRepository refreshTokenRepository;
    private final AdminJwtTokenProvider tokenProvider;
    private final PasswordEncoder passwordEncoder;

    /**
     * Login paso 1: verificar email + password.
     * Si el usuario tiene TOTP habilitado, devuelve tempToken para paso 2.
     */
    @Transactional
    public AdminAuthResponse login(AdminLoginRequest request, String ipAddress) {
        AdminUser user = adminUserRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Credenciales inválidas"));

        // Verificar estado
        if (!"ACTIVE".equals(user.getStatus())) {
            throw new RuntimeException("Cuenta bloqueada o inactiva");
        }

        // Verificar bloqueo temporal
        if (user.getLockedUntil() != null && LocalDateTime.now().isBefore(user.getLockedUntil())) {
            throw new RuntimeException("Cuenta bloqueada temporalmente. Intente más tarde.");
        }

        // Verificar contraseña
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            user.setFailedAttempts((short) (user.getFailedAttempts() + 1));
            if (user.getFailedAttempts() >= 3) {
                user.setLockedUntil(LocalDateTime.now().plusMinutes(30));
                user.setStatus("BLOCKED");
            }
            adminUserRepository.save(user);
            throw new RuntimeException("Credenciales inválidas");
        }

        // Resetear intentos fallidos
        user.setFailedAttempts((short) 0);
        user.setLockedUntil(null);
        user.setLastLoginAt(LocalDateTime.now());
        user.setLastLoginIp(ipAddress);
        adminUserRepository.save(user);

        // Si tiene TOTP, devolver tempToken
        if (Boolean.TRUE.equals(user.getTotpEnabled())) {
            String tempToken = generateTempToken(user);
            return AdminAuthResponse.builder()
                    .totpRequired(true)
                    .tempToken(tempToken)
                    .build();
        }

        // Sin TOTP: generar tokens directamente
        return generateAuthResponse(user);
    }

    /**
     * Login paso 2: verificar código TOTP.
     */
    @Transactional
    public AdminAuthResponse verifyTotp(AdminTotpVerifyRequest request) {
        String payload = new String(Base64.getDecoder().decode(request.getTempToken()), StandardCharsets.UTF_8);
        String[] parts = payload.split(":");
        if (parts.length != 2) throw new RuntimeException("Token temporal inválido");

        UUID userId = UUID.fromString(parts[0]);
        String expectedHash = parts[1];

        AdminUser user = adminUserRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        // Verificar tempToken
        String actualHash = hashTempToken(userId.toString());
        if (!expectedHash.equals(actualHash)) {
            throw new RuntimeException("Token temporal inválido o expirado");
        }

        // Verificar código TOTP
        if (user.getTotpSecret() == null) {
            throw new RuntimeException("TOTP no configurado");
        }

        DefaultCodeVerifier verifier = new DefaultCodeVerifier(
                new DefaultCodeGenerator(), new SystemTimeProvider());
        if (!verifier.isValidCode(user.getTotpSecret(), request.getCode())) {
            throw new RuntimeException("Código de verificación inválido");
        }

        return generateAuthResponse(user);
    }

    /** Refrescar token de acceso */
    @Transactional
    public AdminAuthResponse refreshToken(String refreshTokenStr) {
        if (!tokenProvider.validateToken(refreshTokenStr)) {
            throw new RuntimeException("Refresh token inválido o expirado");
        }

        String tokenType = tokenProvider.getTokenType(refreshTokenStr);
        if (!"admin_refresh".equals(tokenType)) {
            throw new RuntimeException("Tipo de token inválido");
        }

        UUID userId = tokenProvider.getUserIdFromToken(refreshTokenStr);
        AdminUser user = adminUserRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        // Verificar en BD
        String tokenHash = hashToken(refreshTokenStr);
        AdminRefreshToken storedToken = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new RuntimeException("Refresh token no encontrado"));

        if (storedToken.isExpired() || storedToken.isRevoked()) {
            throw new RuntimeException("Refresh token expirado o revocado");
        }

        // Revocar token anterior
        storedToken.setRevokedAt(LocalDateTime.now());
        refreshTokenRepository.save(storedToken);

        return generateAuthResponse(user);
    }

    @Transactional
    public void logout(String refreshTokenStr) {
        String tokenHash = hashToken(refreshTokenStr);
        refreshTokenRepository.findByTokenHash(tokenHash)
                .ifPresent(token -> {
                    token.setRevokedAt(LocalDateTime.now());
                    refreshTokenRepository.save(token);
                });
    }

    /** Obtener perfil del admin autenticado */
    @Transactional(readOnly = true)
    public AdminUserResponse getProfile(UUID userId) {
        AdminUser user = adminUserRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        return toUserResponse(user);
    }

    // --- Helpers ---

    private AdminAuthResponse generateAuthResponse(AdminUser user) {
        String accessToken = tokenProvider.generateAccessToken(
                user.getId(), user.getEmail(), user.getRole().getCode());
        String refreshToken = tokenProvider.generateRefreshToken(user.getId());

        // Guardar refresh token en BD
        AdminRefreshToken rt = AdminRefreshToken.builder()
                .adminUser(user)
                .tokenHash(hashToken(refreshToken))
                .expiresAt(LocalDateTime.now().plusHours(8))
                .build();
        refreshTokenRepository.save(rt);

        return AdminAuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .totpRequired(false)
                .user(toUserResponse(user))
                .build();
    }

    private String generateTempToken(AdminUser user) {
        String raw = user.getId() + ":" + hashTempToken(user.getId().toString());
        return Base64.getEncoder().encodeToString(raw.getBytes(StandardCharsets.UTF_8));
    }

    private String hashTempToken(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest((input + "temp_secret_salt").getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash).substring(0, 16);
        } catch (Exception e) {
            throw new RuntimeException("Error generating temp token", e);
        }
    }

    private String hashToken(String token) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new RuntimeException("Error hashing token", e);
        }
    }

    private AdminUserResponse toUserResponse(AdminUser user) {
        return AdminUserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole().getCode())
                .roleName(user.getRole().getName())
                .phone(user.getPhone())
                .avatarUrl(user.getAvatarUrl())
                .position(user.getPosition())
                .status(user.getStatus())
                .totpEnabled(Boolean.TRUE.equals(user.getTotpEnabled()))
                .lastLoginAt(user.getLastLoginAt())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
