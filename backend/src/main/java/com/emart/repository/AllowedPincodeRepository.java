package com.emart.repository;

import com.emart.entity.AllowedPincode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AllowedPincodeRepository extends JpaRepository<AllowedPincode, Long> {
    Optional<AllowedPincode> findByPincode(String pincode);
    boolean existsByPincodeAndIsActiveTrue(String pincode);
    List<AllowedPincode> findAllByOrderByPincodeAsc();
}
