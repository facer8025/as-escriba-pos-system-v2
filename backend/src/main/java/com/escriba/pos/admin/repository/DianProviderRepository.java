package com.escriba.pos.admin.repository;

import com.escriba.pos.admin.model.entity.DianProvider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface DianProviderRepository extends JpaRepository<DianProvider, Integer> {
    Optional<DianProvider> findByCode(String code);
    boolean existsByCode(String code);
    List<DianProvider> findByIsEnabledTrue();
}
