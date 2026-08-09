package com.escriba.pos.admin.repository;

import com.escriba.pos.admin.model.entity.PaymentGateway;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentGatewayRepository extends JpaRepository<PaymentGateway, Integer> {
    Optional<PaymentGateway> findByCode(String code);
    boolean existsByCode(String code);
    List<PaymentGateway> findByIsEnabledTrue();
}
