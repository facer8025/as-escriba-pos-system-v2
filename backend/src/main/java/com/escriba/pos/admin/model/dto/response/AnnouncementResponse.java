package com.escriba.pos.admin.model.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class AnnouncementResponse {
    private UUID id;
    private String title;
    private String type;
    private String bodyHtml;
    private String headerImageUrl;
    private String targetCriteria;
    private String channels;
    private Integer bannerDurationDays;
    private LocalDateTime scheduledAt;
    private LocalDateTime sentAt;
    private String status;
    private Integer totalRecipients;
    private BigDecimal openRate;
    private String createdByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private long deliveredCount;
    private long openedCount;
}
