package com.escriba.pos.admin.repository;

import com.escriba.pos.admin.model.entity.SystemConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface SystemConfigRepository extends JpaRepository<SystemConfig, Integer> {
    Optional<SystemConfig> findByConfigKey(String configKey);
    boolean existsByConfigKey(String configKey);
}
