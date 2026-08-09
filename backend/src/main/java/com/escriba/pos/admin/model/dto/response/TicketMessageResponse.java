package com.escriba.pos.admin.model.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class TicketMessageResponse {
    private UUID id;
    private UUID ticketId;
    private String senderType;
    private UUID senderId;
    private String senderName;
    private String body;
    private Boolean isInternalNote;
    private String attachments;
    private LocalDateTime createdAt;
}
