package com.escriba.pos.repository;

import com.escriba.pos.model.entity.Sale;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface SaleRepository extends JpaRepository<Sale, UUID> {

    @Query("SELECT s FROM Sale s WHERE s.company.id = :companyId " +
           "AND (:customerId IS NULL OR s.customer.id = :customerId) " +
           "AND (:status IS NULL OR s.status = :status) " +
           "ORDER BY s.createdAt DESC")
    Page<Sale> findByFilters(@Param("companyId") UUID companyId,
                             @Param("customerId") UUID customerId,
                             @Param("status") String status,
                             Pageable pageable);

    @Query("SELECT s FROM Sale s WHERE s.session.id = :sessionId ORDER BY s.createdAt DESC")
    List<Sale> findBySessionId(UUID sessionId);

    long countByCompanyIdAndCreatedAtBetween(UUID companyId, LocalDateTime from, LocalDateTime to);

    @Query("SELECT COALESCE(SUM(s.total), 0) FROM Sale s WHERE s.company.id = :companyId " +
           "AND s.createdAt BETWEEN :from AND :to AND s.status = 'COMPLETED'")
    BigDecimal sumTotalByCompanyAndDateBetween(UUID companyId, LocalDateTime from, LocalDateTime to);

    @Query("SELECT COALESCE(SUM(s.total), 0) FROM Sale s WHERE s.session.id = :sessionId " +
           "AND s.status = 'COMPLETED'")
    BigDecimal sumTotalBySessionId(UUID sessionId);

    long countByCompanyIdAndSaleNumberStartingWith(UUID companyId, String prefix);

    @Query(value = "SELECT CAST(s.created_at AS DATE) AS day, " +
           "COALESCE(SUM(s.total), 0) AS total, COUNT(*) AS cnt " +
           "FROM sales s WHERE s.company_id = :companyId " +
           "AND s.created_at BETWEEN :from AND :to AND s.status = 'COMPLETED' " +
           "GROUP BY CAST(s.created_at AS DATE) ORDER BY day", nativeQuery = true)
    List<Object[]> sumTotalGroupedByDay(@Param("companyId") UUID companyId,
                                        @Param("from") LocalDateTime from,
                                        @Param("to") LocalDateTime to);
}
