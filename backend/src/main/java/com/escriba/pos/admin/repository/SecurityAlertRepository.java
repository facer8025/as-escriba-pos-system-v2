package com.escriba.pos.admin.repository;

import com.escriba.pos.admin.model.entity.SecurityAlert;
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
public interface SecurityAlertRepository extends JpaRepository<SecurityAlert, UUID> {
    Page<SecurityAlert> findByStatusOrderByTriggeredAtDesc(String status, Pageable pageable);
    List<SecurityAlert> findByAdminUserIdOrderByTriggeredAtDesc(UUID adminUserId);
    long countByStatus(String status);

    @Query("SELECT a FROM SecurityAlert a WHERE a.triggeredAt >= :since ORDER BY a.triggeredAt DESC")
    List<SecurityAlert> findRecentSince(@Param("since") LocalDateTime since);

    @Query("SELECT a FROM SecurityAlert a WHERE " +
           "(:status IS NULL OR a.status = :status) " +
           "ORDER BY a.triggeredAt DESC")
    Page<SecurityAlert> findByFilters(@Param("status") String status, Pageable pageable);
}
