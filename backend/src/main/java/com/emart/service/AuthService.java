package com.emart.service;

import com.emart.dto.AuthResponse;
import com.emart.dto.DealerRegisterRequest;
import com.emart.dto.LoginRequest;
import com.emart.dto.RegisterRequest;
import com.emart.entity.ApprovalStatus;
import com.emart.entity.Role;
import com.emart.entity.User;
import com.emart.exception.ApiException;
import com.emart.repository.UserRepository;
import com.emart.security.JwtUtil;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final AppNotificationService appNotificationService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager, JwtUtil jwtUtil,
                       AppNotificationService appNotificationService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.appNotificationService = appNotificationService;
    }

    /** P1-AUTH-01: public registration always creates a CUSTOMER. */
    public AuthResponse registerCustomer(RegisterRequest req) {
        if (userRepository.existsByMobile(req.mobile())) {
            throw ApiException.conflict("This mobile number is already registered. Please login.");
        }

        User user = new User();
        user.setName(req.name().trim());
        user.setMobile(req.mobile().trim());
        user.setEmail(req.email() != null ? req.email().trim() : null);
        user.setPasswordHash(passwordEncoder.encode(req.password()));
        user.setRole(Role.CUSTOMER);
        user.setApproved(true); // customers are auto-approved
        user.setApprovalStatus(ApprovalStatus.APPROVED);
        userRepository.save(user);

        return buildAuth(user);
    }

    /** P2-DEAL-01: dealer self-registration. Created as DEALER, NOT approved, NO token returned. */
    public void registerDealer(DealerRegisterRequest req) {
        if (userRepository.existsByMobile(req.mobile())) {
            throw ApiException.conflict("This mobile number is already registered. Please login.");
        }

        User dealer = new User();
        dealer.setName(req.name().trim());
        dealer.setMobile(req.mobile().trim());
        dealer.setEmail(req.email() != null ? req.email().trim() : null);
        dealer.setPasswordHash(passwordEncoder.encode(req.password()));
        dealer.setRole(Role.DEALER);
        dealer.setShopName(req.shopName().trim());
        dealer.setContactPerson(req.contactPerson() != null && !req.contactPerson().isBlank()
                ? req.contactPerson().trim() : req.name().trim());
        dealer.setGstNumber(req.gstNumber() != null && !req.gstNumber().isBlank()
                ? req.gstNumber().trim() : null);
        // Pending admin approval: cannot log in / see wholesale until approved.
        dealer.setApproved(false);
        dealer.setApprovalStatus(ApprovalStatus.PENDING);
        userRepository.save(dealer);

        // P4-NOTI: alert admins of the new dealer request.
        appNotificationService.notifyAdmins("DEALER_REQUEST", "New dealer request",
                dealer.getShopName() + " (" + dealer.getName() + ") registered and is awaiting approval.",
                "/admin/dealers");
    }

    /** P1-AUTH-02 / P1-AUTH-03 / P2-DEAL-02: login by mobile + password, returns JWT. */
    public AuthResponse login(LoginRequest req) {
        // Verify password first (throws BadCredentialsException -> handled globally)
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.mobile(), req.password()));

        User user = userRepository.findByMobile(req.mobile())
                .orElseThrow(() -> ApiException.notFound("User not found."));

        // Dealers must be approved before they can log in (P2-DEAL-01/02).
        if (user.getRole() == Role.DEALER && user.getApprovalStatus() != ApprovalStatus.APPROVED) {
            if (user.getApprovalStatus() == ApprovalStatus.REJECTED) {
                throw ApiException.forbidden("Your dealer application was rejected."
                        + (user.getRejectionReason() != null ? " Reason: " + user.getRejectionReason() : ""));
            }
            throw ApiException.forbidden("Your dealer account is pending admin approval. Please try again later.");
        }

        return buildAuth(user);
    }

    private AuthResponse buildAuth(User user) {
        String token = jwtUtil.generateToken(user.getId(), user.getMobile(), user.getRole().name());
        return new AuthResponse(token, user.getId(), user.getName(), user.getMobile(), user.getRole().name());
    }
}
