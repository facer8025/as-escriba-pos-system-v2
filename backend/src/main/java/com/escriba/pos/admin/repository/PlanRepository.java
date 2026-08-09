package com.escriba.pos.admin.repository;

import com.escriba.pos.admin.model.entity.Plan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PlanRepository extends JpaRepository<Plan, Integer> {
    List<Plan> findByStatusOrderByName(String status);
    List<Plan> findByIsVisibleWebTrueAndStatusOrderByPriceMonthlyAsc(String status);
}
