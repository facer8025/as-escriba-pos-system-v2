package com.escriba.pos.admin.repository;

import com.escriba.pos.admin.model.entity.LicenseHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface LicenseHistoryRepository extends JpaRepository<LicenseHistory, UUID> {
    List<LicenseHistory> findByLicenseIdOrderByChangedAtDesc(UUID licenseId);
}
