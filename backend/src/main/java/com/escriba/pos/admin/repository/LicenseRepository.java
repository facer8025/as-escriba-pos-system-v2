package com.escriba.pos.admin.repository;

import com.escriba.pos.admin.model.entity.License;
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
public interface LicenseRepository extends JpaRepository<License, UUID> {
    List<License> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);
    long countByStatus(String status);
    long countByExpiresAtBetween(LocalDateTime start, LocalDateTime end);

    @Query("SELECT COALESCE(SUM(l.pricePaidMonthly), 0) FROM License l " +
           "WHERE l.status = 'ACTIVE' AND l.licenseType = 'PAID' AND l.expiresAt > CURRENT_TIMESTAMP")
    Long calculateMRR();

    @Query("SELECT l FROM License l WHERE " +
           "(:status IS NULL OR l.status = :status) " +
           "ORDER BY l.createdAt DESC")
    Page<License> findByFilters(@Param("status") String status, Pageable pageable);
}
