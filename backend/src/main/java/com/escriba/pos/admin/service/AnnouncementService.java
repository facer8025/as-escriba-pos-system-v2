package com.escriba.pos.admin.service;

import com.escriba.pos.admin.exception.AdminBusinessException;
import com.escriba.pos.admin.model.dto.request.CreateAnnouncementRequest;
import com.escriba.pos.admin.model.dto.request.UpdateAnnouncementRequest;
import com.escriba.pos.admin.model.dto.response.AnnouncementResponse;
import com.escriba.pos.admin.model.entity.AdminUser;
import com.escriba.pos.admin.model.entity.Announcement;
import com.escriba.pos.admin.model.entity.AnnouncementDelivery;
import com.escriba.pos.admin.model.entity.Tenant;
import com.escriba.pos.admin.repository.AnnouncementDeliveryRepository;
import com.escriba.pos.admin.repository.AnnouncementRepository;
import com.escriba.pos.admin.repository.TenantRepository;
import com.escriba.pos.admin.service.EmailService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnnouncementService {

    private final AnnouncementRepository announcementRepository;
    private final AnnouncementDeliveryRepository deliveryRepository;
    private final TenantRepository tenantRepository;
    private final ObjectMapper objectMapper;
    private final EmailService emailService;

        @Transactional(readOnly = true)
    public Page<AnnouncementResponse> listAnnouncements(String status, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size);
        Page<Announcement> result;

        if (status != null && !status.isBlank()) {
            result = announcementRepository.findByStatusOrderByCreatedAtDesc(status, pageRequest);
        } else {
            result = announcementRepository.findAllByOrderByCreatedAtDesc(pageRequest);
        }

        return result.map(this::toResponse);
    }

        @Transactional(readOnly = true)
    public AnnouncementResponse getAnnouncement(UUID id) {
        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new AdminBusinessException("Comunicado no encontrado"));
        return toResponse(announcement);
    }

    @Transactional
    public AnnouncementResponse createAnnouncement(CreateAnnouncementRequest request, AdminUser createdBy) {
        String channelsJson = "[]";
        try {
            channelsJson = objectMapper.writeValueAsString(
                    request.getChannels() != null ? request.getChannels() : List.of("EMAIL"));
        } catch (JsonProcessingException ignored) {}

        Announcement announcement = Announcement.builder()
                .title(request.getTitle())
                .type(request.getType() != null ? request.getType() : "GENERAL")
                .bodyHtml(request.getBodyHtml())
                .headerImageUrl(request.getHeaderImageUrl())
                .channels(channelsJson)
                .targetCriteria(request.getTargetCriteria())
                .bannerDurationDays(request.getBannerDurationDays() != null ? request.getBannerDurationDays() : 7)
                .scheduledAt(request.getScheduledAt())
                .status(request.getScheduledAt() != null ? "SCHEDULED" : "DRAFT")
                .totalRecipients(0)
                .createdBy(createdBy)
                .build();

        announcement = announcementRepository.save(announcement);
        return toResponse(announcement);
    }

    @Transactional
    public AnnouncementResponse updateAnnouncement(UUID id, UpdateAnnouncementRequest request) {
        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new AdminBusinessException("Comunicado no encontrado"));

        if ("SENT".equals(announcement.getStatus())) {
            throw new AdminBusinessException("No se puede modificar un comunicado ya enviado");
        }

        if (request.getTitle() != null) announcement.setTitle(request.getTitle());
        if (request.getType() != null) announcement.setType(request.getType());
        if (request.getBodyHtml() != null) announcement.setBodyHtml(request.getBodyHtml());
        if (request.getHeaderImageUrl() != null) announcement.setHeaderImageUrl(request.getHeaderImageUrl());
        if (request.getBannerDurationDays() != null) announcement.setBannerDurationDays(request.getBannerDurationDays());
        if (request.getScheduledAt() != null) announcement.setScheduledAt(request.getScheduledAt());
        if (request.getTargetCriteria() != null) announcement.setTargetCriteria(request.getTargetCriteria());
        if (request.getStatus() != null) announcement.setStatus(request.getStatus());

        if (request.getChannels() != null) {
            try {
                announcement.setChannels(objectMapper.writeValueAsString(request.getChannels()));
            } catch (JsonProcessingException ignored) {}
        }

        announcement = announcementRepository.save(announcement);
        return toResponse(announcement);
    }

    @Transactional
    public AnnouncementResponse sendAnnouncement(UUID id) {
        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new AdminBusinessException("Comunicado no encontrado"));

        if ("SENT".equals(announcement.getStatus())) {
            throw new AdminBusinessException("El comunicado ya fue enviado");
        }

        // Calculate target tenants based on criteria
        List<Tenant> targets = calculateTargets(announcement.getTargetCriteria());

        // Create delivery records
        List<String> channels = parseChannels(announcement.getChannels());
        boolean hasEmail = channels.contains("EMAIL");

        for (Tenant tenant : targets) {
            for (String channel : channels) {
                AnnouncementDelivery delivery = AnnouncementDelivery.builder()
                        .announcement(announcement)
                        .tenant(tenant)
                        .channel(channel)
                        .status("SENT")
                        .sentAt(LocalDateTime.now())
                        .build();
                deliveryRepository.save(delivery);

                // Send real email if channel is EMAIL and tenant has email
                if (hasEmail && "EMAIL".equals(channel) && tenant.getEmail() != null) {
                    emailService.sendAnnouncement(tenant.getEmail(),
                            announcement.getTitle(), announcement.getBodyHtml());
                }
            }
        }

        announcement.setStatus("SENT");
        announcement.setSentAt(LocalDateTime.now());
        announcement.setTotalRecipients(targets.size() * channels.size());
        announcement = announcementRepository.save(announcement);

        return toResponse(announcement);
    }

    private List<Tenant> calculateTargets(String targetCriteria) {
        if (targetCriteria == null || targetCriteria.isBlank()) {
            return tenantRepository.findByStatus("ACTIVE");
        }
        try {
            var json = objectMapper.readTree(targetCriteria);
            var statuses = json.get("statuses");
            var excludeIds = json.get("excludeTenantIds");

            List<Tenant> targets;
            if (statuses != null && statuses.isArray() && statuses.size() > 0) {
                targets = new java.util.ArrayList<>();
                for (var status : statuses) {
                    targets.addAll(tenantRepository.findByStatus(status.asText()));
                }
            } else {
                targets = new java.util.ArrayList<>(tenantRepository.findByStatus("ACTIVE"));
            }

            // Excluir empresas específicas
            if (excludeIds != null && excludeIds.isArray()) {
                var excludeSet = new java.util.HashSet<String>();
                for (var id : excludeIds) excludeSet.add(id.asText());
                targets.removeIf(t -> excludeSet.contains(t.getId().toString()));
            }

            return targets;
        } catch (Exception e) {
            return tenantRepository.findByStatus("ACTIVE");
        }
    }

    private List<String> parseChannels(String channelsJson) {
        try {
            List<String> channels = objectMapper.readValue(channelsJson, List.class);
            return channels != null && !channels.isEmpty() ? channels : List.of("EMAIL");
        } catch (Exception e) {
            return List.of("EMAIL");
        }
    }

    private AnnouncementResponse toResponse(Announcement announcement) {
        long delivered = deliveryRepository.countByAnnouncementId(announcement.getId());
        long opened = 0;
        try {
            opened = announcementRepository.countByAnnouncementIdAndOpenedAtIsNotNull(announcement.getId());
        } catch (Exception ignored) {}

        return AnnouncementResponse.builder()
                .id(announcement.getId())
                .title(announcement.getTitle())
                .type(announcement.getType())
                .bodyHtml(announcement.getBodyHtml())
                .headerImageUrl(announcement.getHeaderImageUrl())
                .targetCriteria(announcement.getTargetCriteria())
                .channels(announcement.getChannels())
                .bannerDurationDays(announcement.getBannerDurationDays())
                .scheduledAt(announcement.getScheduledAt())
                .sentAt(announcement.getSentAt())
                .status(announcement.getStatus())
                .totalRecipients(announcement.getTotalRecipients())
                .openRate(announcement.getOpenRate())
                .createdByName(announcement.getCreatedBy() != null ?
                        announcement.getCreatedBy().getFirstName() + " " + announcement.getCreatedBy().getLastName() : null)
                .createdAt(announcement.getCreatedAt())
                .updatedAt(announcement.getUpdatedAt())
                .deliveredCount(delivered)
                .openedCount(opened)
                .build();
    }
}
