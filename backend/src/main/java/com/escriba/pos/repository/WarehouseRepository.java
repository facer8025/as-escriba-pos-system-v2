package com.escriba.pos.repository;

import com.escriba.pos.model.entity.Warehouse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WarehouseRepository extends JpaRepository<Warehouse, UUID> {
    List<Warehouse> findByBranchCompanyId(UUID companyId);
    List<Warehouse> findByBranchId(UUID branchId);
}
