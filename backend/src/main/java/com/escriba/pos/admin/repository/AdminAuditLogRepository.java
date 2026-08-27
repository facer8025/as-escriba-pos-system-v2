package com.escriba.pos.admin.repository;

import com.escriba.pos.admin.model.entity.AdminAuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.UUID;

@Repository
public interface AdminAuditLogRepository extends JpaRepository<AdminAuditLog, Long> {
    @Query("SELECT a FROM AdminAuditLog a WHERE " +
           "(:category IS NULL OR a.category = :category) " +
           "AND (:action IS NULL OR a.action = :action) " +
           "AND (:result IS NULL OR a.result = :result) " +
           "AND (cast(:fromDate as timestamp) IS NULL OR a.timestamp >= :fromDate) " +
           "AND (cast(:toDate as timestamp) IS NULL OR a.timestamp <= :toDate) " +
           "ORDER BY a.timestamp DESC")
    Page<AdminAuditLog> findByFilters(@Param("category") String category,
                                      @Param("action") String action,
                                      @Param("result") String result,
                                      @Param("fromDate") LocalDateTime fromDate,
                                      @Param("toDate") LocalDateTime toDate,
                                      Pageable pageable);
}
