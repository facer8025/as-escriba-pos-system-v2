package com.escriba.pos.admin.model.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class UpdateAnnouncementRequest {
    private String title;
    private String type;
    private String bodyHtml;
    private String headerImageUrl;
    private List<String> channels;
    private Integer bannerDurationDays;
    private LocalDateTime scheduledAt;
    private String targetCriteria;
    private String status;  // DRAFT, SCHEDULED, CANCELLED
}
