package com.escriba.pos.repository;

import com.escriba.pos.model.entity.Bank;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BankRepository extends JpaRepository<Bank, Short> {
    List<Bank> findByActiveTrueOrderByName();
    boolean existsByCodeIgnoreCase(String code);
}
