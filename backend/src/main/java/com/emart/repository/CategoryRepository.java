package com.emart.repository;

import com.emart.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByIsActiveTrueOrderByNameAsc();
    boolean existsByNameIgnoreCase(String name);
}
