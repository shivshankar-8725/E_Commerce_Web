package com.emart.repository;

import com.emart.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {

    // Customer-facing catalogue: only active products. Stock filtering / labels handled in service.
    @Query("SELECT p FROM Product p WHERE p.isActive = true " +
           "AND (:categoryId IS NULL OR p.category.id = :categoryId) " +
           "AND (:q IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :q, '%'))) " +
           "ORDER BY p.createdAt DESC")
    List<Product> searchActive(@Param("categoryId") Long categoryId, @Param("q") String q);

    // Admin: all products regardless of active/stock
    List<Product> findAllByOrderByCreatedAtDesc();

    boolean existsByCategoryIdAndIsActiveTrue(Long categoryId);
}
