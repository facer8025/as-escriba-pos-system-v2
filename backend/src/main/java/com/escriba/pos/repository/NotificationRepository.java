package com.escriba.pos.repository;

import com.escriba.pos.model.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    @Query("SELECT n FROM Notification n WHERE n.company.id = :companyId " +
           "AND (:userId IS NULL OR n.user.id = :userId) " +
           "ORDER BY n.createdAt DESC")
    Page<Notification> findByFilters(@Param("companyId") UUID companyId,
                                     @Param("userId") UUID userId,
                                     Pageable pageable);

    long countByCompanyIdAndUserIdAndIsReadFalse(UUID companyId, UUID userId);

    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = CURRENT_TIMESTAMP " +
           "WHERE n.company.id = :companyId AND (n.user.id = :userId OR n.user IS NULL)")
    void markAllAsRead(@Param("companyId") UUID companyId, @Param("userId") UUID userId);

    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = CURRENT_TIMESTAMP WHERE n.id = :id")
    void markAsRead(@Param("id") UUID id);
}
