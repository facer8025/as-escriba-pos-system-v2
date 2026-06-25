package com.escriba.pos.repository;

import com.escriba.pos.model.entity.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, UUID> {

    Optional<Customer> findByCompanyIdAndDocumentNumber(UUID companyId, String documentNumber);

    @Query("SELECT c FROM Customer c WHERE c.company.id = :companyId AND c.active = true " +
           "AND (LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR c.documentNumber LIKE CONCAT('%', :search, '%')) ORDER BY c.name")
    List<Customer> searchByCompanyId(UUID companyId, String search);

    Page<Customer> findByCompanyIdOrderByName(UUID companyId, Pageable pageable);

    List<Customer> findByCompanyIdOrderByName(UUID companyId);

    long countByCompanyId(UUID companyId);
}
