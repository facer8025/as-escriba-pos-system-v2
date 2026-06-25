package com.escriba.pos.repository;

import com.escriba.pos.model.entity.NotificationConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface NotificationConfigRepository extends JpaRepository<NotificationConfig, UUID> {
    List<NotificationConfig> findByCompanyIdOrderByNotificationType(UUID companyId);
    Optional<NotificationConfig> findByCompanyIdAndNotificationType(UUID companyId, String notificationType);
}
