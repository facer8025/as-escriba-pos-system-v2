package com.escriba.pos.admin.repository;

import com.escriba.pos.admin.model.entity.AnnouncementDelivery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AnnouncementDeliveryRepository extends JpaRepository<AnnouncementDelivery, UUID> {
    List<AnnouncementDelivery> findByAnnouncementId(UUID announcementId);
    List<AnnouncementDelivery> findByTenantId(UUID tenantId);
    Optional<AnnouncementDelivery> findByAnnouncementIdAndTenantIdAndChannel(
            UUID announcementId, UUID tenantId, String channel);
    long countByAnnouncementIdAndStatus(UUID announcementId, String status);
    long countByTenantIdAndStatus(UUID tenantId, String status);
}
