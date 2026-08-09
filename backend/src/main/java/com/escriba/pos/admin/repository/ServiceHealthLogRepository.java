package com.escriba.pos.admin.repository;

import com.escriba.pos.admin.model.entity.ServiceHealthLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ServiceHealthLogRepository extends JpaRepository<ServiceHealthLog, Long> {
    List<ServiceHealthLog> findTop20ByServiceNameOrderByCheckedAtDesc(String serviceName);

    @Query("SELECT h FROM ServiceHealthLog h WHERE h.serviceName = :serviceName " +
           "AND h.checkedAt >= :since ORDER BY h.checkedAt DESC")
    List<ServiceHealthLog> findRecentByService(@Param("serviceName") String serviceName,
                                                @Param("since") LocalDateTime since);

    @Query("SELECT DISTINCT h.serviceName FROM ServiceHealthLog h")
    List<String> findAllServiceNames();

    @Query(value = "SELECT h.status FROM service_health_logs h WHERE h.service_name = :serviceName " +
           "ORDER BY h.checked_at DESC LIMIT 1", nativeQuery = true)
    String findLatestStatusByService(@Param("serviceName") String serviceName);

    @Query("SELECT h FROM ServiceHealthLog h WHERE h.status <> 'UP' AND h.checkedAt >= :since " +
           "ORDER BY h.checkedAt DESC")
    List<ServiceHealthLog> findRecentErrors(@Param("since") LocalDateTime since);
}
