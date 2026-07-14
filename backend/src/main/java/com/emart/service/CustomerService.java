package com.emart.service;

import com.emart.dto.CustomerResponse;
import com.emart.entity.Role;
import com.emart.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
public class CustomerService {

    private final UserRepository userRepository;

    public CustomerService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /** P1-ADMIN-07: list customers, optional search by name/mobile. */
    public List<CustomerResponse> listCustomers(String search) {
        List<com.emart.entity.User> users = StringUtils.hasText(search)
                ? userRepository.searchByRole(Role.CUSTOMER, search.trim())
                : userRepository.findByRoleOrderByCreatedAtDesc(Role.CUSTOMER);
        return users.stream().map(CustomerResponse::from).toList();
    }
}
