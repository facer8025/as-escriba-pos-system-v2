package com.escriba.pos.admin.model.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class CreateAnnouncementRequest {
    private String title;
    private String type;              // GENERAL, MAINTENANCE, NEW_FEATURE, ALERT, NEWSLETTER
    private String bodyHtml;
    private String headerImageUrl;
    private List<String> channels;    // EMAIL, BANNER, IN_APP, SMS
    private Integer bannerDurationDays;
    private LocalDateTime scheduledAt;
    private String targetCriteria;    // JSON: { "planSlugs": [...], "statuses": [...], "cities": [...], "excludeTenantIds": [...] }
}
