package com.escriba.pos.admin.repository;

import com.escriba.pos.admin.model.entity.TenantInvoice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface TenantInvoiceRepository extends JpaRepository<TenantInvoice, UUID> {
    List<TenantInvoice> findByTenantIdOrderByIssuedAtDesc(UUID tenantId);
    long countByStatus(String status);
    long countByCreatedAtAfter(LocalDateTime date);

    @Query("SELECT COUNT(i) FROM TenantInvoice i WHERE i.invoiceNumber LIKE :prefix%")
    long countByInvoiceNumberPrefix(@Param("prefix") String prefix);

    Page<TenantInvoice> findByStatus(String status, Pageable pageable);

    List<TenantInvoice> findByStatusAndDueDateBefore(String status, LocalDate date);

    @Modifying
    @Query("UPDATE TenantInvoice i SET i.license = null WHERE i.license.id = :licenseId")
    void detachFromLicense(@Param("licenseId") UUID licenseId);
}
