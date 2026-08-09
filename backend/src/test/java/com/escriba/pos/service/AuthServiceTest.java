package com.escriba.pos.service;

import com.escriba.pos.dto.request.ChangePasswordRequest;
import com.escriba.pos.dto.request.LoginRequest;
import com.escriba.pos.dto.request.RegisterUserRequest;
import com.escriba.pos.dto.response.AuthResponse;
import com.escriba.pos.exception.BusinessException;
import com.escriba.pos.model.entity.Branch;
import com.escriba.pos.model.entity.Company;
import com.escriba.pos.model.entity.User;
import com.escriba.pos.model.enums.UserRole;
import com.escriba.pos.repository.BranchRepository;
import com.escriba.pos.repository.CompanyRepository;
import com.escriba.pos.repository.UserRepository;
import com.escriba.pos.security.jwt.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private CompanyRepository companyRepository;
    @Mock private BranchRepository branchRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtTokenProvider tokenProvider;

    private AuthService authService;

    private UUID userId;
    private User user;

    @BeforeEach
    void setUp() {
        authService = new AuthService(userRepository, companyRepository, branchRepository,
                passwordEncoder, tokenProvider);

        userId = UUID.randomUUID();
        user = User.builder()
                .id(userId)
                .firstName("Maria")
                .lastName("Gomez")
                .email("maria@escriba.co")
                .username("maria@escriba.co")
                .passwordHash("$2a$10$hash")
                .roleId((short) 3) // CA -> Cajero
                .active(true)
                .failedAttempts((short) 0)
                .mustChangePassword(false)
                .build();
    }

    private LoginRequest loginRequest() {
        LoginRequest req = new LoginRequest();
        req.setUsernameOrEmail("maria@escriba.co");
        req.setPassword("password123");
        return req;
    }

    @Test
    @DisplayName("Login exitoso resetea intentos, genera tokens y devuelve datos del usuario")
    void login_exitoso_generaTokensYReseteaIntentos() {
        when(userRepository.findByEmailOrUsername(any(), any())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "$2a$10$hash")).thenReturn(true);
        when(tokenProvider.generateAccessToken(userId, "maria@escriba.co", "CA")).thenReturn("access-token");
        when(tokenProvider.generateRefreshToken(userId)).thenReturn("refresh-token");

        AuthResponse response = authService.login(loginRequest());

        assertEquals(userId, response.getUserId());
        assertEquals("CA", response.getRole());
        assertEquals("Cajero", response.getRoleName());
        assertEquals("access-token", response.getAccessToken());
        assertEquals("refresh-token", response.getRefreshToken());
        assertEquals("Bearer", response.getTokenType());
        assertEquals(Short.valueOf((short) 0), user.getFailedAttempts());
        assertNull(user.getLockedUntil());
        assertNotNull(user.getLastLogin());
        verify(userRepository, times(1)).save(user);
    }

    @Test
    @DisplayName("Login exitoso con sucursal devuelve companyId y branchId")
    void login_exitoso_conSucursal_devuelveEmpresa() {
        Company company = Company.builder().id(UUID.randomUUID()).name("ESCRIBA SAS").build();
        Branch branch = Branch.builder().id(UUID.randomUUID()).name("Sede Norte").company(company).build();
        user.setBranch(branch);

        when(userRepository.findByEmailOrUsername(any(), any())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(any(), any())).thenReturn(true);
        when(tokenProvider.generateAccessToken(any(), any(), any())).thenReturn("access-token");
        when(tokenProvider.generateRefreshToken(any())).thenReturn("refresh-token");

        AuthResponse response = authService.login(loginRequest());

        assertEquals(company.getId(), response.getCompanyId());
        assertEquals("ESCRIBA SAS", response.getCompanyName());
        assertEquals(branch.getId(), response.getBranchId());
        assertEquals("Sede Norte", response.getBranchName());
    }

    @Test
    @DisplayName("Usuario inexistente lanza BusinessException genérica")
    void login_usuarioInexistente_lanzaExcepcion() {
        when(userRepository.findByEmailOrUsername(any(), any())).thenReturn(Optional.empty());

        BusinessException ex = assertThrows(BusinessException.class, () -> authService.login(loginRequest()));
        assertEquals("Credenciales incorrectas", ex.getMessage());
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Contraseña incorrecta incrementa intentos fallidos")
    void login_contrasenaIncorrecta_incrementaIntentos() {
        when(userRepository.findByEmailOrUsername(any(), any())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "$2a$10$hash")).thenReturn(false);

        BusinessException ex = assertThrows(BusinessException.class, () -> authService.login(loginRequest()));
        assertEquals("Credenciales incorrectas. Intento 1 de 5.", ex.getMessage());
        assertEquals(Short.valueOf((short) 1), user.getFailedAttempts());
        verify(userRepository, times(1)).save(user);
    }

    @Test
    @DisplayName("Cuenta desactivada lanza BusinessException")
    void login_cuentaDesactivada_lanzaExcepcion() {
        user.setActive(false);
        when(userRepository.findByEmailOrUsername(any(), any())).thenReturn(Optional.of(user));

        BusinessException ex = assertThrows(BusinessException.class, () -> authService.login(loginRequest()));
        assertEquals("Cuenta desactivada. Contacta al administrador.", ex.getMessage());
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Cuenta bloqueada hasta una fecha futura lanza BusinessException")
    void login_cuentaBloqueada_lanzaExcepcion() {
        user.setLockedUntil(LocalDateTime.now().plusHours(2));
        when(userRepository.findByEmailOrUsername(any(), any())).thenReturn(Optional.of(user));

        BusinessException ex = assertThrows(BusinessException.class, () -> authService.login(loginRequest()));
        assertTrue(ex.getMessage().contains("Cuenta bloqueada"));
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Cuenta con bloqueo expirado puede iniciar sesión")
    void login_bloqueoExpirado_permiteLogin() {
        user.setLockedUntil(LocalDateTime.now().minusMinutes(5));
        when(userRepository.findByEmailOrUsername(any(), any())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(any(), any())).thenReturn(true);
        when(tokenProvider.generateAccessToken(any(), any(), any())).thenReturn("access-token");
        when(tokenProvider.generateRefreshToken(any())).thenReturn("refresh-token");

        AuthResponse response = authService.login(loginRequest());
        assertNotNull(response.getAccessToken());
        assertNull(user.getLockedUntil(), "El bloqueo vencido debe limpiarse");
    }

    @Test
    @DisplayName("Refresh token inválido lanza BusinessException")
    void refreshToken_invalido_lanzaExcepcion() {
        when(tokenProvider.validateToken("token-malo")).thenReturn(false);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> authService.refreshToken("token-malo"));
        assertEquals("Token de refresco inválido o expirado", ex.getMessage());
    }

    @Test
    @DisplayName("Refresh token válido genera nuevo access token")
    void refreshToken_valido_generaNuevoAccessToken() {
        when(tokenProvider.validateToken("refresh-válido")).thenReturn(true);
        when(tokenProvider.getUserIdFromToken("refresh-válido")).thenReturn(userId);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(tokenProvider.generateAccessToken(userId, "maria@escriba.co", "CA")).thenReturn("nuevo-access");

        AuthResponse response = authService.refreshToken("refresh-válido");

        assertEquals("nuevo-access", response.getAccessToken());
        assertEquals("refresh-válido", response.getRefreshToken());
        assertEquals(userId, response.getUserId());
    }

    @Test
    @DisplayName("Cambio de contraseña con contraseña actual incorrecta lanza BusinessException")
    void changePassword_contrasenaActualIncorrecta_lanzaExcepcion() {
        ChangePasswordRequest req = new ChangePasswordRequest();
        req.setCurrentPassword("mal");
        req.setNewPassword("nueva123");
        req.setConfirmPassword("nueva123");

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("mal", "$2a$10$hash")).thenReturn(false);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> authService.changePassword(userId, req));
        assertEquals("La contraseña actual es incorrecta", ex.getMessage());
    }

    @Test
    @DisplayName("Cambio de contraseña con confirmación distinta lanza BusinessException")
    void changePassword_confirmacionDistinta_lanzaExcepcion() {
        ChangePasswordRequest req = new ChangePasswordRequest();
        req.setCurrentPassword("correcta");
        req.setNewPassword("nueva123");
        req.setConfirmPassword("otra123");

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("correcta", "$2a$10$hash")).thenReturn(true);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> authService.changePassword(userId, req));
        assertEquals("Las contraseñas no coinciden", ex.getMessage());
    }

    @Test
    @DisplayName("Cambio de contraseña exitoso actualiza el hash y limpia flag mustChangePassword")
    void changePassword_exitoso_actualizaHash() {
        ChangePasswordRequest req = new ChangePasswordRequest();
        req.setCurrentPassword("correcta");
        req.setNewPassword("nueva123");
        req.setConfirmPassword("nueva123");

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("correcta", "$2a$10$hash")).thenReturn(true);
        when(passwordEncoder.encode("nueva123")).thenReturn("$2a$10$nuevohash");

        authService.changePassword(userId, req);

        assertEquals("$2a$10$nuevohash", user.getPasswordHash());
        assertFalse(user.getMustChangePassword());
        assertNotNull(user.getLastPasswordChange());
        verify(userRepository, times(1)).save(user);
    }

    @Test
    @DisplayName("Registro con email duplicado lanza BusinessException")
    void registerUser_emailDuplicado_lanzaExcepcion() {
        RegisterUserRequest req = new RegisterUserRequest();
        req.setEmail("maria@escriba.co");
        req.setCompanyId(UUID.randomUUID());

        when(userRepository.existsByEmail("maria@escriba.co")).thenReturn(true);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> authService.registerUser(req));
        assertEquals("El correo ya está registrado", ex.getMessage());
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Registro exitoso crea usuario con mustChangePassword=true y rol por defecto")
    void registerUser_exitoso_creaUsuario() {
        UUID companyId = UUID.randomUUID();
        Company company = Company.builder().id(companyId).name("ESCRIBA SAS").build();

        RegisterUserRequest req = new RegisterUserRequest();
        req.setEmail("nuevo@escriba.co");
        req.setFirstName("Pedro");
        req.setLastName("Diaz");
        req.setPassword("clave123");
        req.setCompanyId(companyId);

        when(userRepository.existsByEmail("nuevo@escriba.co")).thenReturn(false);
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));
        when(passwordEncoder.encode("clave123")).thenReturn("$2a$10$hashnuevo");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        authService.registerUser(req);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository, times(1)).save(captor.capture());
        User created = captor.getValue();
        assertEquals("nuevo@escriba.co", created.getEmail());
        assertEquals((short) 2, created.getRoleId(), "Rol por defecto AD");
        assertTrue(created.getActive());
        assertTrue(created.getMustChangePassword());
    }
}
