package com.escriba.pos.admin.repository;

import com.escriba.pos.admin.model.entity.Module;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ModuleRepository extends JpaRepository<Module, Short> {
    Optional<Module> findByCode(String code);
    List<Module> findByActiveTrueOrderBySortOrderAsc();
}
