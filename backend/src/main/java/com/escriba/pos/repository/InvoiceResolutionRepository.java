package com.escriba.pos.repository;

import com.escriba.pos.model.entity.InvoiceResolution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface InvoiceResolutionRepository extends JpaRepository<InvoiceResolution, UUID> {
    List<InvoiceResolution> findByCompanyIdOrderByCreatedAtDesc(UUID companyId);
    List<InvoiceResolution> findByCompanyIdAndActiveTrue(UUID companyId);
}
