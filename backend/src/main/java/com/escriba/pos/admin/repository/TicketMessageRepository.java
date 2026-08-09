package com.escriba.pos.admin.repository;

import com.escriba.pos.admin.model.entity.TicketMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface TicketMessageRepository extends JpaRepository<TicketMessage, UUID> {
    List<TicketMessage> findByTicketIdOrderByCreatedAtAsc(UUID ticketId);
    long countByTicketId(UUID ticketId);
}
