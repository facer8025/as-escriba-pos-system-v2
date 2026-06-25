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
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class CashSessionService {

    private final CashSessionRepository sessionRepository;
    private final CashRegisterRepository registerRepository;
    private final UserRepository userRepository;
    private final SaleRepository saleRepository;

    @Transactional
    public CashSession openSession(UUID registerId, UUID userId, BigDecimal openingAmount,
                                    String openingDenominations, String notes) {
        if (sessionRepository.existsByRegisterIdAndStatus(registerId, "OPEN")) {
            throw new BusinessException("Ya hay una sesión abierta en esta caja");
        }

        CashRegister register = registerRepository.findById(registerId)
                .orElseThrow(() -> new BusinessException("Caja no encontrada"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("Usuario no encontrado"));

        CashSession session = CashSession.builder()
                .register(register)
                .user(user)
                .openedAt(LocalDateTime.now())
                .openingAmount(openingAmount)
                .openingDenominations(openingDenominations)
                .status(CashSessionStatus.OPEN)
                .notes(notes)
                .totalSales(0)
                .totalSalesAmount(BigDecimal.ZERO)
                .build();

        return sessionRepository.save(session);
    }

    @Transactional
    public CashSession closeSession(UUID sessionId, UUID userId, BigDecimal countedAmount,
                                     String closingDenominations, BigDecimal cashWithdrawn,
                                     BigDecimal baseForNextSession, String notes) {
        CashSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new BusinessException("Sesión no encontrada"));

        if (session.getStatus() != CashSessionStatus.OPEN) {
            throw new BusinessException("La sesión ya está cerrada");
        }

        BigDecimal totalSales = saleRepository.sumTotalBySessionId(sessionId);
        if (totalSales == null) totalSales = BigDecimal.ZERO;

        BigDecimal expectedCash = session.getOpeningAmount().add(totalSales);
        BigDecimal difference = countedAmount.subtract(expectedCash);

        session.setClosedAt(LocalDateTime.now());
        session.setClosingAmount(expectedCash);
        session.setCountedAmount(countedAmount);
        session.setDifferenceAmount(difference);
        session.setClosingDenominations(closingDenominations);
        session.setCashWithdrawn(cashWithdrawn);
        session.setBaseForNextSession(baseForNextSession);
        session.setTotalSalesAmount(totalSales);
        session.setStatus(CashSessionStatus.CLOSED);
        session.setNotes(notes);

        return sessionRepository.save(session);
    }

    public Optional<CashSession> getOpenSession(UUID registerId, UUID userId) {
        return sessionRepository.findOpenSession(registerId, userId);
    }

    public Optional<CashSession> getOpenSessionByCompany(UUID companyId) {
        return sessionRepository.findOpenSessionByCompanyId(companyId);
    }

    public Map<String, Object> getSessionSummary(UUID sessionId) {
        CashSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new BusinessException("Sesión no encontrada"));

        BigDecimal totalSales = saleRepository.sumTotalBySessionId(sessionId);
        if (totalSales == null) totalSales = BigDecimal.ZERO;

        Map<String, Object> summary = new HashMap<>();
        summary.put("session", session);
        summary.put("totalSales", totalSales);
        summary.put("expectedCash", session.getOpeningAmount().add(totalSales));

        if (session.getStatus() == CashSessionStatus.CLOSED) {
            summary.put("difference", session.getCountedAmount()
                    .subtract(session.getOpeningAmount().add(totalSales)));
        }

        return summary;
    }
}
