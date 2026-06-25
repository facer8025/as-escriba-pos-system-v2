package com.escriba.pos.repository;

import com.escriba.pos.model.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID>, JpaSpecificationExecutor<Product> {

    Optional<Product> findByCompanyIdAndInternalCode(UUID companyId, String internalCode);

    Optional<Product> findByCompanyIdAndBarcode(UUID companyId, String barcode);

    @Query("SELECT p FROM Product p WHERE p.company.id = :companyId AND p.status = 'ACTIVE' " +
           "ORDER BY p.name")
    List<Product> findActiveByCompanyId(UUID companyId);

    Page<Product> findByCompanyId(UUID companyId, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.company.id = :companyId AND p.manageInventory = true " +
           "AND p.currentStock <= p.stockMin ORDER BY (p.currentStock - p.stockMin) ASC")
    List<Product> findLowStockProducts(UUID companyId);

    @Query("SELECT COUNT(p) FROM Product p WHERE p.company.id = :companyId " +
           "AND p.manageInventory = true AND p.currentStock <= 0")
    long countOutOfStock(UUID companyId);

    @Query("SELECT SUM(p.currentStock * p.avgCost) FROM Product p WHERE p.company.id = :companyId " +
           "AND p.manageInventory = true")
    BigDecimal calculateInventoryValue(UUID companyId);
}
