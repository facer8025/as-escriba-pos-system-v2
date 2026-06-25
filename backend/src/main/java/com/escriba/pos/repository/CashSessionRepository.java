package com.escriba.pos.repository;

import com.escriba.pos.model.entity.CashSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CashSessionRepository extends JpaRepository<CashSession, UUID> {

    Optional<CashSession> findByRegisterIdAndStatus(UUID registerId, String status);

    @Query("SELECT cs FROM CashSession cs WHERE cs.register.id = :registerId " +
           "AND cs.status = 'OPEN' AND cs.user.id = :userId")
    Optional<CashSession> findOpenSession(UUID registerId, UUID userId);

    @Query("SELECT cs FROM CashSession cs WHERE cs.register.branch.company.id = :companyId " +
           "AND cs.status = 'OPEN'")
    Optional<CashSession> findOpenSessionByCompanyId(UUID companyId);

    boolean existsByRegisterIdAndStatus(UUID registerId, String status);
}
