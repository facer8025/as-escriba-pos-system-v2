package com.escriba.pos.repository;

import com.escriba.pos.model.entity.PurchaseOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, UUID> {

    @Query("SELECT po FROM PurchaseOrder po WHERE po.company.id = :companyId " +
           "AND (:supplierId IS NULL OR po.supplier.id = :supplierId) " +
           "AND (:status IS NULL OR po.status = :status) " +
           "ORDER BY po.orderDate DESC")
    Page<PurchaseOrder> findByFilters(@Param("companyId") UUID companyId,
                                      @Param("supplierId") UUID supplierId,
                                      @Param("status") String status,
                                      Pageable pageable);

    List<PurchaseOrder> findByCompanyIdAndStatusOrderByOrderDateDesc(UUID companyId, String status);

    long countByCompanyIdAndStatusIn(UUID companyId, List<String> statuses);
}
