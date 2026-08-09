package com.escriba.pos.admin.repository;

import com.escriba.pos.admin.model.entity.AdminRefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AdminRefreshTokenRepository extends JpaRepository<AdminRefreshToken, UUID> {
    Optional<AdminRefreshToken> findByTokenHash(String tokenHash);
    void deleteByAdminUserId(UUID adminUserId);
}
