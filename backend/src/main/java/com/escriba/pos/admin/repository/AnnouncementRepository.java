package com.escriba.pos.admin.repository;

import com.escriba.pos.admin.model.entity.Announcement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface AnnouncementRepository extends JpaRepository<Announcement, UUID> {
    Page<Announcement> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);
    Page<Announcement> findAllByOrderByCreatedAtDesc(Pageable pageable);
    List<Announcement> findByScheduledAtBeforeAndStatus(LocalDateTime before, String status);
    long countByStatus(String status);

    @Query("SELECT COUNT(a) FROM Announcement a JOIN AnnouncementDelivery d ON d.announcement.id = a.id " +
           "WHERE a.id = :announcementId AND d.openedAt IS NOT NULL")
    long countByAnnouncementIdAndOpenedAtIsNotNull(@Param("announcementId") UUID announcementId);

    @Query("SELECT a FROM Announcement a WHERE " +
           "(:status IS NULL OR a.status = :status) " +
           "ORDER BY a.createdAt DESC")
    Page<Announcement> findByFilters(@Param("status") String status, Pageable pageable);
}
