package com.escriba.pos.service;

import com.escriba.pos.exception.BusinessException;
import com.escriba.pos.model.entity.CashRegister;
import com.escriba.pos.model.entity.CashSession;
import com.escriba.pos.model.entity.User;
import com.escriba.pos.model.enums.CashSessionStatus;
import com.escriba.pos.repository.CashRegisterRepository;
import com.escriba.pos.repository.CashSessionRepository;
import com.escriba.pos.repository.SaleRepository;
import com.escriba.pos.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CashSessionServiceTest {

    @Mock private CashSessionRepository sessionRepository;
    @Mock private CashRegisterRepository registerRepository;
    @Mock private UserRepository userRepository;
    @Mock private SaleRepository saleRepository;

    private CashSessionService cashSessionService;

    private UUID registerId, userId, sessionId;
    private CashRegister register;
    private User user;
    private CashSession session;

    @BeforeEach
    void setUp() {
        cashSessionService = new CashSessionService(sessionRepository, registerRepository,
                userRepository, saleRepository);

        registerId = UUID.randomUUID();
        userId = UUID.randomUUID();
        sessionId = UUID.randomUUID();

        register = CashRegister.builder().id(registerId).name("Caja 1").build();
        user = User.builder().id(userId).firstName("Carlos").lastName("Rojas").build();
        session = CashSession.builder()
                .id(sessionId)
                .register(register)
                .user(user)
                .openingAmount(new BigDecimal("200000"))
                .status(CashSessionStatus.OPEN)
                .build();
    }

    @Test
    @DisplayName("openSession crea sesión abierta con montos iniciales")
    void openSession_creaSesionAbierta() {
        when(sessionRepository.existsByRegisterIdAndStatus(registerId, "OPEN")).thenReturn(false);
        when(registerRepository.findById(registerId)).thenReturn(Optional.of(register));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(sessionRepository.save(any(CashSession.class))).thenAnswer(inv -> inv.getArgument(0));

        CashSession created = cashSessionService.openSession(registerId, userId,
                new BigDecimal("200000"), "{\"100000\":2}", null);

        assertEquals(CashSessionStatus.OPEN, created.getStatus());
        assertEquals(new BigDecimal("200000"), created.getOpeningAmount());
        assertEquals(0, created.getTotalSales());
        assertEquals(BigDecimal.ZERO, created.getTotalSalesAmount());
        assertNotNull(created.getOpenedAt());
        verify(sessionRepository).save(any(CashSession.class));
    }

    @Test
    @DisplayName("openSession con sesión ya abierta lanza BusinessException")
    void openSession_sesionYaAbierta_lanzaExcepcion() {
        when(sessionRepository.existsByRegisterIdAndStatus(registerId, "OPEN")).thenReturn(true);

        assertThrows(BusinessException.class, () -> cashSessionService.openSession(
                registerId, userId, BigDecimal.ZERO, null, null));
        verify(sessionRepository, never()).save(any());
    }

    @Test
    @DisplayName("openSession con caja inexistente lanza BusinessException")
    void openSession_cajaNoEncontrada_lanzaExcepcion() {
        when(sessionRepository.existsByRegisterIdAndStatus(registerId, "OPEN")).thenReturn(false);
        when(registerRepository.findById(registerId)).thenReturn(Optional.empty());

        assertThrows(BusinessException.class, () -> cashSessionService.openSession(
                registerId, userId, BigDecimal.ZERO, null, null));
    }

    @Test
    @DisplayName("closeSession calcula efectivo esperado y diferencia")
    void closeSession_calculaTotales() {
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(saleRepository.sumTotalBySessionId(sessionId)).thenReturn(new BigDecimal("450000"));
        when(sessionRepository.save(any(CashSession.class))).thenAnswer(inv -> inv.getArgument(0));

        // Apertura 200.000 + ventas 450.000 = esperado 650.000; conteo 640.000 → diferencia -10.000
        CashSession closed = cashSessionService.closeSession(sessionId, userId,
                new BigDecimal("640000"), null, BigDecimal.ZERO, new BigDecimal("200000"), null);

        assertEquals(CashSessionStatus.CLOSED, closed.getStatus());
        assertEquals(new BigDecimal("650000"), closed.getClosingAmount());
        assertEquals(new BigDecimal("640000"), closed.getCountedAmount());
        assertEquals(new BigDecimal("-10000"), closed.getDifferenceAmount());
        assertEquals(new BigDecimal("450000"), closed.getTotalSalesAmount());
        assertNotNull(closed.getClosedAt());
    }

    @Test
    @DisplayName("closeSession con sesión inexistente lanza BusinessException")
    void closeSession_sesionNoEncontrada_lanzaExcepcion() {
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.empty());

        assertThrows(BusinessException.class, () -> cashSessionService.closeSession(
                sessionId, userId, BigDecimal.ZERO, null, null, null, null));
        verify(sessionRepository, never()).save(any());
    }

    @Test
    @DisplayName("closeSession con sesión ya cerrada lanza BusinessException")
    void closeSession_yaCerrada_lanzaExcepcion() {
        session.setStatus(CashSessionStatus.CLOSED);
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(session));

        assertThrows(BusinessException.class, () -> cashSessionService.closeSession(
                sessionId, userId, BigDecimal.ZERO, null, null, null, null));
    }

    @Test
    @DisplayName("getSessionSummary retorna esperado y diferencia en sesión cerrada")
    void getSessionSummary_retornaTotales() {
        session.setStatus(CashSessionStatus.CLOSED);
        session.setCountedAmount(new BigDecimal("700000"));
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(saleRepository.sumTotalBySessionId(sessionId)).thenReturn(new BigDecimal("500000"));

        Map<String, Object> summary = cashSessionService.getSessionSummary(sessionId);

        assertEquals(new BigDecimal("500000"), summary.get("totalSales"));
        assertEquals(new BigDecimal("700000"), summary.get("expectedCash")); // 200.000 + 500.000
        assertEquals(new BigDecimal("0"), summary.get("difference")); // 700.000 - 700.000
    }

    @Test
    @DisplayName("getOpenSession delega al repositorio")
    void getOpenSession_delega() {
        when(sessionRepository.findOpenSession(registerId, userId)).thenReturn(Optional.of(session));

        var result = cashSessionService.getOpenSession(registerId, userId);

        assertTrue(result.isPresent());
        assertEquals(sessionId, result.get().getId());
    }
}
