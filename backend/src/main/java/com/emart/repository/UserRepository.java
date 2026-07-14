package com.emart.repository;

import com.emart.entity.ApprovalStatus;
import com.emart.entity.Role;
import com.emart.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByMobile(String mobile);
    boolean existsByMobile(String mobile);

    List<User> findByRoleOrderByCreatedAtDesc(Role role);

    List<User> findByRoleAndApprovalStatusOrderByCreatedAtDesc(Role role, ApprovalStatus status);

    @Query("SELECT u FROM User u WHERE u.role = :role AND " +
           "(LOWER(u.name) LIKE LOWER(CONCAT('%', :q, '%')) OR u.mobile LIKE CONCAT('%', :q, '%')) " +
           "ORDER BY u.createdAt DESC")
    List<User> searchByRole(@Param("role") Role role, @Param("q") String q);
}
