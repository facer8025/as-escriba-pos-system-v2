package com.escriba.pos.service;

import com.escriba.pos.dto.request.LoginRequest;
import com.escriba.pos.dto.request.RegisterUserRequest;
import com.escriba.pos.dto.request.ChangePasswordRequest;
import com.escriba.pos.dto.request.ResetPasswordRequest;
import com.escriba.pos.dto.response.AuthResponse;
import com.escriba.pos.dto.response.UserResponse;
import com.escriba.pos.exception.BusinessException;
import com.escriba.pos.model.entity.User;
import com.escriba.pos.model.entity.Company;
import com.escriba.pos.model.entity.Branch;
import com.escriba.pos.model.enums.UserRole;
import com.escriba.pos.repository.UserRepository;
import com.escriba.pos.repository.CompanyRepository;
import com.escriba.pos.repository.BranchRepository;
import com.escriba.pos.security.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final BranchRepository branchRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmailOrUsername(
                request.getUsernameOrEmail(), request.getUsernameOrEmail())
                .orElseThrow(() -> new BusinessException("Credenciales incorrectas"));

        // Validate account status
        if (!user.getActive()) {
            throw new BusinessException("Cuenta desactivada. Contacta al administrador.");
        }

        if (user.getLockedUntil() != null && user.getLockedUntil().isAfter(LocalDateTime.now())) {
            long minutesLeft = java.time.Duration.between(LocalDateTime.now(), user.getLockedUntil()).toMinutes();
            throw new BusinessException(
                    "Cuenta bloqueada por " + minutesLeft + " minutos. Contacta al administrador.");
        }

        // Validate password
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            user.setFailedAttempts((short)(user.getFailedAttempts() + 1));
            userRepository.save(user);
            throw new BusinessException(
                    "Credenciales incorrectas. Intento " + user.getFailedAttempts() + " de 5.");
        }

        // Reset failed attempts and update login
        user.setFailedAttempts((short)0);
        user.setLockedUntil(null);
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        // Generate tokens
        String accessToken = tokenProvider.generateAccessToken(user.getId(), user.getEmail(), user.getRole().name());
        String refreshToken = tokenProvider.generateRefreshToken(user.getId());

        Company company = user.getBranch() != null ? user.getBranch().getCompany() : null;
        Branch branch = user.getBranch();

        return AuthResponse.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .roleName(user.getRole().getDisplayName())
                .avatarUrl(user.getAvatarUrl())
                .companyId(company != null ? company.getId() : null)
                .companyName(company != null ? company.getName() : null)
                .branchId(branch != null ? branch.getId() : null)
                .branchName(branch != null ? branch.getName() : null)
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .mustChangePassword(user.getMustChangePassword())
                .expiresIn(86400000L)
                .build();
    }

    @Transactional
    public void logout(UUID userId) {
        log.info("User {} logged out", userId);
    }

    public AuthResponse refreshToken(String refreshToken) {
        if (!tokenProvider.validateToken(refreshToken)) {
            throw new BusinessException("Token de refresco inválido o expirado");
        }

        UUID userId = tokenProvider.getUserIdFromToken(refreshToken);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("Usuario no encontrado"));

        String newAccessToken = tokenProvider.generateAccessToken(
                user.getId(), user.getEmail(), user.getRole().name());

        return AuthResponse.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .roleName(user.getRole().getDisplayName())
                .accessToken(newAccessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(86400000L)
                .build();
    }

    @Transactional
    public void changePassword(UUID userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("Usuario no encontrado"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BusinessException("La contraseña actual es incorrecta");
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BusinessException("Las contraseñas no coinciden");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setMustChangePassword(false);
        user.setLastPasswordChange(LocalDateTime.now());
        userRepository.save(user);
    }

    @Transactional
    public UserResponse registerUser(RegisterUserRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("El correo ya está registrado");
        }

        Company company = companyRepository.findById(request.getCompanyId())
                .orElseThrow(() -> new BusinessException("Empresa no encontrada"));

        Branch branch = null;
        if (request.getBranchId() != null) {
            branch = branchRepository.findById(request.getBranchId())
                    .orElseThrow(() -> new BusinessException("Sucursal no encontrada"));
        }

        User user = User.builder()
                .branch(branch)
                .roleId(request.getRoleId() != null ? request.getRoleId() : (short)2)
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .username(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .active(true)
                .mustChangePassword(true)
                .build();

        user = userRepository.save(user);

        return UserResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .roleId(user.getRoleId())
                .roleCode(user.getRole().name())
                .roleName(user.getRole().getDisplayName())
                .active(user.getActive())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
