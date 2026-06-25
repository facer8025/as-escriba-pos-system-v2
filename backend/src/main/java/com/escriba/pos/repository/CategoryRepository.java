package com.escriba.pos.repository;

import com.escriba.pos.model.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CategoryRepository extends JpaRepository<Category, UUID> {

    List<Category> findByCompanyIdAndParentIsNullOrderByName(UUID companyId);

    List<Category> findByCompanyIdAndParentIdOrderByName(UUID companyId, UUID parentId);

    @Query("SELECT c FROM Category c WHERE c.company.id = :companyId AND c.active = true ORDER BY c.name")
    List<Category> findActiveByCompanyId(UUID companyId);

    long countByCompanyId(UUID companyId);

    boolean existsByCompanyIdAndNameAndParentId(UUID companyId, String name, UUID parentId);
}
