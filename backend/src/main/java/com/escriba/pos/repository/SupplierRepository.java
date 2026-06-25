package com.escriba.pos.repository;

import com.escriba.pos.model.entity.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SupplierRepository extends JpaRepository<Supplier, UUID> {

    Optional<Supplier> findByCompanyIdAndDocumentNumber(UUID companyId, String documentNumber);

    @Query("SELECT s FROM Supplier s WHERE s.company.id = :companyId AND s.active = true " +
           "AND (LOWER(s.businessName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR s.documentNumber LIKE CONCAT('%', :search, '%')) ORDER BY s.businessName")
    List<Supplier> searchByCompanyId(UUID companyId, String search);

    List<Supplier> findByCompanyIdOrderByBusinessName(UUID companyId);

    long countByCompanyId(UUID companyId);
}
