package com.escriba.pos.repository;

import com.escriba.pos.model.entity.Unit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UnitRepository extends JpaRepository<Unit, Integer> {
    List<Unit> findByActiveTrueOrderByName();
    boolean existsByCodeIgnoreCase(String code);
}
