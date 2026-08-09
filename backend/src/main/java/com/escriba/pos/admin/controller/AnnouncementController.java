package com.escriba.pos.admin.controller;

import com.escriba.pos.admin.model.dto.request.CreateAnnouncementRequest;
import com.escriba.pos.admin.model.dto.request.UpdateAnnouncementRequest;
import com.escriba.pos.admin.model.dto.response.AnnouncementResponse;
import com.escriba.pos.admin.model.entity.AdminUser;
import com.escriba.pos.admin.service.AnnouncementService;
import com.escriba.pos.dto.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/admin/announcements")
@RequiredArgsConstructor
public class AnnouncementController {

    private final AnnouncementService announcementService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<AnnouncementResponse>>> listAnnouncements(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {
        return ResponseEntity.ok(ApiResponse.success(announcementService.listAnnouncements(status, page, size)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AnnouncementResponse>> getAnnouncement(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(announcementService.getAnnouncement(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AnnouncementResponse>> createAnnouncement(
            @RequestBody CreateAnnouncementRequest request,
            @AuthenticationPrincipal AdminUser currentUser) {
        return ResponseEntity.ok(
                ApiResponse.success("Comunicado creado", announcementService.createAnnouncement(request, currentUser)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AnnouncementResponse>> updateAnnouncement(
            @PathVariable UUID id,
            @RequestBody UpdateAnnouncementRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success("Comunicado actualizado", announcementService.updateAnnouncement(id, request)));
    }

    @PostMapping("/{id}/send")
    public ResponseEntity<ApiResponse<AnnouncementResponse>> sendAnnouncement(@PathVariable UUID id) {
        return ResponseEntity.ok(
                ApiResponse.success("Comunicado enviado", announcementService.sendAnnouncement(id)));
    }
}
