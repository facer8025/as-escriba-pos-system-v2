package com.escriba.pos.controller;

import com.escriba.pos.dto.response.ApiResponse;
import com.escriba.pos.model.entity.CashRegister;
import com.escriba.pos.model.entity.CashSession;
import com.escriba.pos.repository.CashRegisterRepository;
import com.escriba.pos.repository.CashSessionRepository;
import com.escriba.pos.service.CashSessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/cash")
@RequiredArgsConstructor
public class CashSessionController {

    private final CashSessionService cashSessionService;
    private final CashSessionRepository sessionRepository;
    private final CashRegisterRepository registerRepository;

    @GetMapping("/registers")
    public ResponseEntity<ApiResponse<List<CashRegister>>> getRegisters(@RequestParam UUID companyId) {
        return ResponseEntity.ok(ApiResponse.success(registerRepository.findByBranchCompanyId(companyId)));
    }

    @GetMapping("/session/open")
    public ResponseEntity<ApiResponse<CashSession>> getOpenSession(
            @RequestParam(required = false) UUID registerId,
            @RequestParam(required = false) UUID userId) {
        return cashSessionService.getOpenSession(registerId, userId)
                .map(s -> ResponseEntity.ok(ApiResponse.success(s)))
                .orElse(ResponseEntity.ok(ApiResponse.success(null)));
    }

    @PostMapping("/session/open")
    public ResponseEntity<ApiResponse<CashSession>> openSession(
            @RequestParam UUID registerId,
            @RequestParam UUID userId,
            @RequestParam BigDecimal openingAmount,
            @RequestParam(required = false) String openingDenominations,
            @RequestParam(required = false) String notes) {
        CashSession session = cashSessionService.openSession(
                registerId, userId, openingAmount, openingDenominations, notes);
        return ResponseEntity.ok(ApiResponse.success("Caja abierta exitosamente", session));
    }

    @PostMapping("/session/{id}/close")
    public ResponseEntity<ApiResponse<CashSession>> closeSession(
            @PathVariable UUID id,
            @RequestParam UUID userId,
            @RequestParam BigDecimal countedAmount,
            @RequestParam(required = false) String closingDenominations,
            @RequestParam(required = false) BigDecimal cashWithdrawn,
            @RequestParam(required = false) BigDecimal baseForNextSession,
            @RequestParam(required = false) String notes) {
        CashSession session = cashSessionService.closeSession(
                id, userId, countedAmount, closingDenominations,
                cashWithdrawn, baseForNextSession, notes);
        return ResponseEntity.ok(ApiResponse.success("Caja cerrada exitosamente", session));
    }

    @GetMapping("/session/{id}/summary")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSummary(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(cashSessionService.getSessionSummary(id)));
    }
}
