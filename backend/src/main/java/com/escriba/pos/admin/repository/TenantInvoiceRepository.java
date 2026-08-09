package com.escriba.pos.admin.repository;

import com.escriba.pos.admin.model.entity.TenantInvoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface TenantInvoiceRepository extends JpaRepository<TenantInvoice, UUID> {
    List<TenantInvoice> findByTenantIdOrderByIssuedAtDesc(UUID tenantId);
    long countByStatus(String status);
    long countByCreatedAtAfter(LocalDateTime date);
}
