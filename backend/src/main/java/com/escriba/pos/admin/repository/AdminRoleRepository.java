package com.escriba.pos.admin.repository;

import com.escriba.pos.admin.model.entity.AdminRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface AdminRoleRepository extends JpaRepository<AdminRole, Short> {
    Optional<AdminRole> findByCode(String code);
}
