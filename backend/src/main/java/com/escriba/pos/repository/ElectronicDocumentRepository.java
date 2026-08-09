package com.escriba.pos.repository;

import com.escriba.pos.model.entity.ElectronicDocument;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ElectronicDocumentRepository extends JpaRepository<ElectronicDocument, UUID> {

    @Query("SELECT d FROM ElectronicDocument d WHERE d.company.id = :companyId " +
           "AND (:status IS NULL OR d.dianStatus = :status) " +
           "ORDER BY d.createdAt DESC")
    Page<ElectronicDocument> findByFilters(@Param("companyId") UUID companyId,
                                           @Param("status") String status,
                                           Pageable pageable);

    long countByDianStatus(String dianStatus);
}
