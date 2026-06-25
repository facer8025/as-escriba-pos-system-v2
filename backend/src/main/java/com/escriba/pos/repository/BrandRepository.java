package com.escriba.pos.repository;

import com.escriba.pos.model.entity.Brand;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BrandRepository extends JpaRepository<Brand, Integer> {
    List<Brand> findByActiveTrueOrderByName();
    boolean existsByNameIgnoreCase(String name);
}
