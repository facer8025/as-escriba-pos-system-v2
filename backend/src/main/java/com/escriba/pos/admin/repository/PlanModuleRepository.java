package com.escriba.pos.admin.repository;

import com.escriba.pos.admin.model.entity.PlanModule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PlanModuleRepository extends JpaRepository<PlanModule, Integer> {
    List<PlanModule> findByPlanId(Integer planId);
    void deleteByPlanId(Integer planId);
}
