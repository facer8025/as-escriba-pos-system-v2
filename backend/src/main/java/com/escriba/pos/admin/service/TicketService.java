package com.escriba.pos.admin.service;

import com.escriba.pos.admin.model.dto.request.AddTicketMessageRequest;
import com.escriba.pos.admin.model.dto.request.CreateTicketRequest;
import com.escriba.pos.admin.model.dto.request.UpdateTicketRequest;
import com.escriba.pos.admin.model.dto.response.TicketMessageResponse;
import com.escriba.pos.admin.model.dto.response.TicketResponse;
import com.escriba.pos.admin.model.dto.response.TicketStatsResponse;
import com.escriba.pos.admin.model.entity.AdminUser;
import com.escriba.pos.admin.model.entity.SupportTicket;
import com.escriba.pos.admin.model.entity.Tenant;
import com.escriba.pos.admin.model.entity.TicketMessage;
import com.escriba.pos.admin.repository.AdminUserRepository;
import com.escriba.pos.admin.repository.SupportTicketRepository;
import com.escriba.pos.admin.repository.TenantRepository;
import com.escriba.pos.admin.repository.TicketMessageRepository;
import com.escriba.pos.admin.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import jakarta.persistence.criteria.*;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final SupportTicketRepository ticketRepository;
    private final TicketMessageRepository messageRepository;
    private final TenantRepository tenantRepository;
    private final AdminUserRepository adminUserRepository;
    private final EntityManager entityManager;
    private final EmailService emailService;

    // ── LIST / FILTER ────────────────────────────────────────────────

    public Page<TicketResponse> listTickets(String search, String status, String priority,
                                             String category, UUID tenantId, UUID assignedTo,
                                             int page, int size) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<SupportTicket> cq = cb.createQuery(SupportTicket.class);
        Root<SupportTicket> root = cq.from(SupportTicket.class);
        List<Predicate> predicates = new ArrayList<>();

        if (search != null && !search.isBlank()) {
            String pattern = "%" + search.toLowerCase() + "%";
            predicates.add(cb.or(
                cb.like(cb.lower(root.get("subject")), pattern),
                cb.like(cb.lower(root.get("ticketNumber")), pattern)
            ));
        }
        if (status != null && !status.isBlank()) {
            predicates.add(cb.equal(root.get("status"), status));
        }
        if (priority != null && !priority.isBlank()) {
            predicates.add(cb.equal(root.get("priority"), priority));
        }
        if (category != null && !category.isBlank()) {
            predicates.add(cb.equal(root.get("category"), category));
        }
        if (tenantId != null) {
            predicates.add(cb.equal(root.get("tenant").get("id"), tenantId));
        }
        if (assignedTo != null) {
            predicates.add(cb.equal(root.get("assignedTo").get("id"), assignedTo));
        }

        cq.where(predicates.toArray(new Predicate[0]));
        cq.orderBy(cb.desc(root.get("createdAt")));

        TypedQuery<SupportTicket> query = entityManager.createQuery(cq);
        query.setFirstResult(page * size);
        query.setMaxResults(size);

        // Count query
        CriteriaQuery<Long> countCq = cb.createQuery(Long.class);
        Root<SupportTicket> countRoot = countCq.from(SupportTicket.class);
        countCq.select(cb.count(countRoot));
        countCq.where(predicates.toArray(new Predicate[0]));
        long total = entityManager.createQuery(countCq).getSingleResult();

        List<TicketResponse> items = query.getResultList().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());

        return new PageImpl<>(items, PageRequest.of(page, size), total);
    }

    // ── GET ─────────────────────────────────────────────────────────

    public TicketResponse getTicket(UUID id) {
        SupportTicket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket no encontrado"));
        return toResponse(ticket);
    }

    // ── CREATE ──────────────────────────────────────────────────────

    @Transactional
    public TicketResponse createTicket(CreateTicketRequest request, AdminUser createdBy) {
        Tenant tenant = null;
        if (request.getTenantId() != null) {
            tenant = tenantRepository.findById(request.getTenantId()).orElse(null);
        }

        // Generate ticket number: T-YYYYMMDD-NNN
        String datePart = LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd"));
        long count = ticketRepository.countByCreatedAtToday(datePart);
        String ticketNumber = String.format("T-%s-%03d", datePart, count + 1);

        // Calculate SLA deadline based on priority
        int slaHours = switch (request.getPriority() != null ? request.getPriority() : "MEDIUM") {
            case "CRITICAL" -> 4;
            case "HIGH" -> 8;
            case "MEDIUM" -> 24;
            case "LOW" -> 72;
            default -> 24;
        };

        SupportTicket ticket = SupportTicket.builder()
                .ticketNumber(ticketNumber)
                .tenant(tenant)
                .subject(request.getSubject())
                .category(request.getCategory() != null ? request.getCategory() : "TECHNICAL")
                .priority(request.getPriority() != null ? request.getPriority() : "MEDIUM")
                .status("OPEN")
                .slaDeadline(LocalDateTime.now().plusHours(slaHours))
                .slaBreached(false)
                .createdByType("ADMIN")
                .createdById(createdBy.getId())
                .build();

        ticket = ticketRepository.save(ticket);

        // Create initial message if body provided
        if (request.getBody() != null && !request.getBody().isBlank()) {
            TicketMessage msg = TicketMessage.builder()
                    .ticket(ticket)
                    .senderType("ADMIN")
                    .senderId(createdBy.getId())
                    .body(request.getBody())
                    .isInternalNote(false)
                    .build();
            messageRepository.save(msg);
        }

        // Notificar por email
        if (ticket.getTenant() != null && ticket.getTenant().getEmail() != null) {
            emailService.sendTicketNotification(
                    ticket.getTenant().getEmail(),
                    ticket.getTicketNumber(),
                    ticket.getSubject(),
                    request.getBody(),
                    "https://admin.escriba.co/soporte/tickets/" + ticket.getId()
            );
        }

        return toResponse(ticket);
    }

    // ── UPDATE ──────────────────────────────────────────────────────

    @Transactional
    public TicketResponse updateTicket(UUID id, UpdateTicketRequest request) {
        SupportTicket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket no encontrado"));

        if (request.getSubject() != null) ticket.setSubject(request.getSubject());
        if (request.getCategory() != null) ticket.setCategory(request.getCategory());
        if (request.getPriority() != null) ticket.setPriority(request.getPriority());
        if (request.getStatus() != null) {
            ticket.setStatus(request.getStatus());
            if ("CLOSED".equals(request.getStatus())) {
                ticket.setClosedAt(LocalDateTime.now());
            }
        }
        if (request.getAssignedTo() != null) {
            AdminUser admin = adminUserRepository.findById(request.getAssignedTo()).orElse(null);
            ticket.setAssignedTo(admin);
        }
        if (request.getResolutionSummary() != null) ticket.setResolutionSummary(request.getResolutionSummary());
        if (request.getRootCause() != null) ticket.setRootCause(request.getRootCause());

        ticket = ticketRepository.save(ticket);
        return toResponse(ticket);
    }

    // ── ASSIGN ──────────────────────────────────────────────────────

    @Transactional
    public TicketResponse assignTicket(UUID id, UUID adminUserId) {
        SupportTicket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket no encontrado"));
        AdminUser admin = adminUserRepository.findById(adminUserId)
                .orElseThrow(() -> new RuntimeException("Usuario admin no encontrado"));

        ticket.setAssignedTo(admin);
        ticket.setStatus("IN_PROGRESS");
        ticket = ticketRepository.save(ticket);
        return toResponse(ticket);
    }

    // ── MESSAGES ────────────────────────────────────────────────────

    public List<TicketMessageResponse> getTicketMessages(UUID ticketId) {
        return messageRepository.findByTicketIdOrderByCreatedAtAsc(ticketId).stream()
                .map(this::toMessageResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public TicketMessageResponse addTicketMessage(UUID ticketId, AddTicketMessageRequest request, AdminUser sender) {
        SupportTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket no encontrado"));

        TicketMessage msg = TicketMessage.builder()
                .ticket(ticket)
                .senderType("ADMIN")
                .senderId(sender.getId())
                .body(request.getBody())
                .isInternalNote(request.getIsInternalNote() != null && request.getIsInternalNote())
                .build();

        msg = messageRepository.save(msg);

        // Re-open ticket if closed and adding a message
        if ("CLOSED".equals(ticket.getStatus())) {
            ticket.setStatus("IN_PROGRESS");
            ticketRepository.save(ticket);
        }

        return toMessageResponse(msg);
    }

    // ── STATS ───────────────────────────────────────────────────────

    public TicketStatsResponse getStats() {
        long open = ticketRepository.countByStatus("OPEN");
        long inProgress = ticketRepository.countByStatus("IN_PROGRESS");
        long waiting = ticketRepository.countByStatus("WAITING_CUSTOMER");
        long closedToday = ticketRepository.countByClosedAtAfter(LocalDateTime.now().withHour(0).withMinute(0).withSecond(0));
        long slaBreached = ticketRepository.countBySlaBreachedTrueAndStatusNot("CLOSED");
        long criticalOpen = ticketRepository.countByPriorityAndStatusNot("CRITICAL", "CLOSED");
        long highOpen = ticketRepository.countByPriorityAndStatusNot("HIGH", "CLOSED");

        // Average resolution time for tickets closed in last 30 days
        Double avgHours = ticketRepository.avgResolutionHours(
                LocalDateTime.now().minusDays(30), LocalDateTime.now());
        double avgResolutionHours = avgHours != null ? Math.round(avgHours * 10.0) / 10.0 : 0;

        return TicketStatsResponse.builder()
                .openTickets(open)
                .inProgressTickets(inProgress)
                .waitingCustomerTickets(waiting)
                .closedToday(closedToday)
                .slaBreached(slaBreached)
                .avgResolutionHours(avgResolutionHours)
                .criticalOpen(criticalOpen)
                .highOpen(highOpen)
                .build();
    }

    // ── MAPPERS ─────────────────────────────────────────────────────

    private TicketResponse toResponse(SupportTicket ticket) {
        long msgCount = messageRepository.countByTicketId(ticket.getId());
        List<TicketMessage> msgs = messageRepository.findByTicketIdOrderByCreatedAtAsc(ticket.getId());
        String lastMsg = msgs.isEmpty() ? null : msgs.get(msgs.size() - 1).getBody();

        return TicketResponse.builder()
                .id(ticket.getId())
                .ticketNumber(ticket.getTicketNumber())
                .tenantId(ticket.getTenant() != null ? ticket.getTenant().getId() : null)
                .tenantName(ticket.getTenant() != null ? ticket.getTenant().getBusinessName() : null)
                .subject(ticket.getSubject())
                .category(ticket.getCategory())
                .priority(ticket.getPriority())
                .status(ticket.getStatus())
                .assignedTo(ticket.getAssignedTo() != null ? ticket.getAssignedTo().getId() : null)
                .assignedToName(ticket.getAssignedTo() != null ?
                        ticket.getAssignedTo().getFirstName() + " " + ticket.getAssignedTo().getLastName() : null)
                .slaDeadline(ticket.getSlaDeadline())
                .slaBreached(ticket.getSlaBreached())
                .createdByType(ticket.getCreatedByType())
                .createdById(ticket.getCreatedById())
                .closedAt(ticket.getClosedAt())
                .resolutionSummary(ticket.getResolutionSummary())
                .rootCause(ticket.getRootCause())
                .satisfactionScore(ticket.getSatisfactionScore())
                .createdAt(ticket.getCreatedAt())
                .updatedAt(ticket.getUpdatedAt())
                .messageCount(msgCount)
                .lastMessage(lastMsg != null ? (lastMsg.length() > 100 ? lastMsg.substring(0, 100) + "..." : lastMsg) : null)
                .build();
    }

    private TicketMessageResponse toMessageResponse(TicketMessage msg) {
        return TicketMessageResponse.builder()
                .id(msg.getId())
                .ticketId(msg.getTicket().getId())
                .senderType(msg.getSenderType())
                .senderId(msg.getSenderId())
                .body(msg.getBody())
                .isInternalNote(msg.getIsInternalNote())
                .attachments(msg.getAttachments())
                .createdAt(msg.getCreatedAt())
                .build();
    }
}
