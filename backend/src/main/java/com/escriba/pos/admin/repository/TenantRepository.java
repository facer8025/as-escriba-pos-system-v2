package com.escriba.pos.admin.repository;

import com.escriba.pos.admin.model.entity.Tenant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantRepository extends JpaRepository<Tenant, UUID> {
    Optional<Tenant> findByNit(String nit);
    Optional<Tenant> findByEmail(String email);
    boolean existsByNit(String nit);
    boolean existsByEmail(String email);
    long countByStatus(String status);

    List<Tenant> findByStatus(String status);

    Page<Tenant> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);

    @Query("SELECT t FROM Tenant t WHERE " +
           "t.status = :status AND " +
           "(t.businessName LIKE CONCAT('%',:search,'%') " +
           "OR t.nit LIKE CONCAT('%',:search,'%')) " +
           "ORDER BY t.createdAt DESC")
    Page<Tenant> findByStatusAndSearch(@Param("status") String status,
                                        @Param("search") String search,
                                        Pageable pageable);

    @Query("SELECT t FROM Tenant t WHERE " +
           "t.businessName LIKE CONCAT('%',:search,'%') " +
           "OR t.nit LIKE CONCAT('%',:search,'%') " +
           "ORDER BY t.createdAt DESC")
    Page<Tenant> findBySearch(@Param("search") String search,
                               Pageable pageable);
}
