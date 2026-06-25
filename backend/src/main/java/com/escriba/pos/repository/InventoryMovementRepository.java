package com.escriba.pos.repository;

import com.escriba.pos.model.entity.InventoryMovement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface InventoryMovementRepository extends JpaRepository<InventoryMovement, UUID> {

    @Query("SELECT im FROM InventoryMovement im WHERE im.product.id = :productId " +
           "AND (:dateFrom IS NULL OR im.createdAt >= :dateFrom) " +
           "AND (:dateTo IS NULL OR im.createdAt <= :dateTo) " +
           "ORDER BY im.createdAt DESC")
    Page<InventoryMovement> findByProductId(UUID productId, LocalDateTime dateFrom,
                                            LocalDateTime dateTo, Pageable pageable);

    List<InventoryMovement> findByProductIdOrderByCreatedAtAsc(UUID productId);

    @Query("SELECT im FROM InventoryMovement im WHERE im.product.id = :productId " +
           "ORDER BY im.createdAt DESC")
    List<InventoryMovement> findRecentByProductId(UUID productId, Pageable pageable);
}
