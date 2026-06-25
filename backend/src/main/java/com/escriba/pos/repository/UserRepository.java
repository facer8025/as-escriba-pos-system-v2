package com.escriba.pos.repository;

import com.escriba.pos.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    Optional<User> findByUsername(String username);

    Optional<User> findByEmailOrUsername(String email, String username);

    boolean existsByEmail(String email);

    boolean existsByUsername(String username);

    @Query("SELECT u FROM User u WHERE u.branch.company.id = :companyId ORDER BY u.firstName, u.lastName")
    List<User> findByCompanyId(UUID companyId);

    @Query("SELECT u FROM User u WHERE u.branch.id = :branchId")
    List<User> findByBranchId(UUID branchId);

    @Query("SELECT u FROM User u WHERE u.roleId = :roleId AND u.active = true")
    List<User> findByRoleIdAndActive(Integer roleId, boolean active);

    @Query("SELECT u FROM User u WHERE LOWER(u.firstName) LIKE LOWER(CONCAT('%', :term, '%')) " +
           "OR LOWER(u.lastName) LIKE LOWER(CONCAT('%', :term, '%')) " +
           "OR LOWER(u.email) LIKE LOWER(CONCAT('%', :term, '%'))")
    List<User> search(String term);
}
