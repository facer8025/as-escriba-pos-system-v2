package com.escriba.pos.repository;

import com.escriba.pos.model.entity.IdType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface IdTypeRepository extends JpaRepository<IdType, Short> {
    Optional<IdType> findByCode(String code);
}
