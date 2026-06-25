package com.escriba.pos.repository;

import com.escriba.pos.model.entity.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductImageRepository extends JpaRepository<ProductImage, UUID> {

    @Query("SELECT pi.imageUrl FROM ProductImage pi WHERE pi.product.id = :productId " +
           "AND pi.isPrimary = true ORDER BY pi.sortOrder ASC LIMIT 1")
    Optional<String> findPrimaryImageUrlByProductId(UUID productId);

    List<ProductImage> findByProductIdOrderBySortOrderAsc(UUID productId);

    long countByProductId(UUID productId);

    @Modifying
    @Query("UPDATE ProductImage pi SET pi.isPrimary = false WHERE pi.product.id = :productId AND pi.isPrimary = true")
    void clearPrimaryByProductId(UUID productId);

    Optional<ProductImage> findFirstByProductIdOrderBySortOrderAsc(UUID productId);
}
