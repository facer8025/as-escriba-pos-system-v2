package com.escriba.pos.admin.repository;

import com.escriba.pos.admin.model.entity.SupportTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface SupportTicketRepository extends JpaRepository<SupportTicket, UUID> {
    long countByStatusNot(String status);
    long countByStatus(String status);
    long countByClosedAtAfter(LocalDateTime dateTime);
    long countBySlaBreachedTrueAndStatusNot(String status);
    long countByPriorityAndStatusNot(String priority, String status);

    @Query("SELECT COUNT(t) FROM SupportTicket t WHERE t.ticketNumber LIKE :datePrefix%")
    long countByCreatedAtToday(@Param("datePrefix") String datePrefix);

    @Query("SELECT AVG(EXTRACT(EPOCH FROM (t.closedAt - t.createdAt)) / 3600.0) FROM SupportTicket t " +
           "WHERE t.status = 'CLOSED' AND t.createdAt >= :since AND t.createdAt <= :until")
    Double avgResolutionHours(@Param("since") LocalDateTime since, @Param("until") LocalDateTime until);

    List<SupportTicket> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);
    List<SupportTicket> findByAssignedToIdOrderByCreatedAtDesc(UUID adminUserId);
}
