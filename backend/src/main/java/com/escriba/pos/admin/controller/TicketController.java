package com.escriba.pos.admin.controller;

import com.escriba.pos.admin.model.dto.request.AddTicketMessageRequest;
import com.escriba.pos.admin.model.dto.request.CreateTicketRequest;
import com.escriba.pos.admin.model.dto.request.UpdateTicketRequest;
import com.escriba.pos.admin.model.dto.response.TicketMessageResponse;
import com.escriba.pos.admin.model.dto.response.TicketResponse;
import com.escriba.pos.admin.model.dto.response.TicketStatsResponse;
import com.escriba.pos.admin.model.entity.AdminUser;
import com.escriba.pos.admin.service.TicketService;
import com.escriba.pos.dto.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/admin/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    // ── STATS ──────────────────────────────────────────────────────

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<TicketStatsResponse>> getStats() {
        return ResponseEntity.ok(ApiResponse.success(ticketService.getStats()));
    }

    // ── LIST ────────────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<ApiResponse<Page<TicketResponse>>> listTickets(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) UUID assignedTo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                ticketService.listTickets(search, status, priority, category, tenantId, assignedTo, page, size)));
    }

    // ── GET ────────────────────────────────────────────────────────

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TicketResponse>> getTicket(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(ticketService.getTicket(id)));
    }

    // ── CREATE ─────────────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<ApiResponse<TicketResponse>> createTicket(
            @RequestBody CreateTicketRequest request,
            @AuthenticationPrincipal AdminUser currentUser) {
        return ResponseEntity.ok(
                ApiResponse.success("Ticket creado", ticketService.createTicket(request, currentUser)));
    }

    // ── UPDATE ─────────────────────────────────────────────────────

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TicketResponse>> updateTicket(
            @PathVariable UUID id,
            @RequestBody UpdateTicketRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success("Ticket actualizado", ticketService.updateTicket(id, request)));
    }

    // ── ASSIGN ─────────────────────────────────────────────────────

    @PostMapping("/{id}/assign/{adminUserId}")
    public ResponseEntity<ApiResponse<TicketResponse>> assignTicket(
            @PathVariable UUID id,
            @PathVariable UUID adminUserId) {
        return ResponseEntity.ok(
                ApiResponse.success("Ticket asignado", ticketService.assignTicket(id, adminUserId)));
    }

    // ── MESSAGES ───────────────────────────────────────────────────

    @GetMapping("/{id}/messages")
    public ResponseEntity<ApiResponse<List<TicketMessageResponse>>> getMessages(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(ticketService.getTicketMessages(id)));
    }

    @PostMapping("/{id}/messages")
    public ResponseEntity<ApiResponse<TicketMessageResponse>> addMessage(
            @PathVariable UUID id,
            @RequestBody AddTicketMessageRequest request,
            @AuthenticationPrincipal AdminUser currentUser) {
        return ResponseEntity.ok(
                ApiResponse.success("Mensaje agregado", ticketService.addTicketMessage(id, request, currentUser)));
    }
}
