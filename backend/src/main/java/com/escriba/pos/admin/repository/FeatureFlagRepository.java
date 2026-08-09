package com.escriba.pos.admin.repository;

import com.escriba.pos.admin.model.entity.FeatureFlag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FeatureFlagRepository extends JpaRepository<FeatureFlag, UUID> {
    Optional<FeatureFlag> findByCode(String code);
    boolean existsByCode(String code);
}
