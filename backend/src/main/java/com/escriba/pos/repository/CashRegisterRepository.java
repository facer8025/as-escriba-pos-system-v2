package com.escriba.pos.repository;

import com.escriba.pos.model.entity.CashRegister;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CashRegisterRepository extends JpaRepository<CashRegister, UUID> {
    List<CashRegister> findByBranchCompanyId(UUID companyId);
    List<CashRegister> findByBranchId(UUID branchId);
}
