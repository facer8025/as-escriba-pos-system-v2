package com.escriba.pos.admin.repository;

import com.escriba.pos.admin.model.entity.MaintenanceWindow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface MaintenanceWindowRepository extends JpaRepository<MaintenanceWindow, UUID> {
    List<MaintenanceWindow> findByStatusOrderByStartsAtDesc(String status);
    List<MaintenanceWindow> findByStartsAtBetween(LocalDateTime from, LocalDateTime to);
    List<MaintenanceWindow> findByStatusAndStartsAtBefore(String status, LocalDateTime before);
    List<MaintenanceWindow> findByStartsAtAfterOrderByStartsAtAsc(LocalDateTime after);
    long countByStatus(String status);
}
