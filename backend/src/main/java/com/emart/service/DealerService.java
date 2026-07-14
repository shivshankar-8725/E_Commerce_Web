package com.emart.service;

import com.emart.dto.DealerResponse;
import com.emart.entity.ApprovalStatus;
import com.emart.entity.Role;
import com.emart.entity.User;
import com.emart.exception.ApiException;
import com.emart.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Admin-side dealer management (P2-DEAL-02): list, approve, reject.
 */
@Service
public class DealerService {

    private final UserRepository userRepository;

    public DealerService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /** List dealers, optionally filtered by approval status (PENDING / APPROVED / REJECTED). */
    public List<DealerResponse> list(String status) {
        List<User> dealers;
        if (status != null && !status.isBlank()) {
            ApprovalStatus st = parseStatus(status);
            dealers = userRepository.findByRoleAndApprovalStatusOrderByCreatedAtDesc(Role.DEALER, st);
        } else {
            dealers = userRepository.findByRoleOrderByCreatedAtDesc(Role.DEALER);
        }
        return dealers.stream().map(DealerResponse::from).toList();
    }

    @Transactional
    public DealerResponse approve(Long dealerId) {
        User dealer = findDealerOrThrow(dealerId);
        if (dealer.getApprovalStatus() == ApprovalStatus.APPROVED) {
            throw ApiException.badRequest("This dealer is already approved.");
        }
        dealer.setApproved(true);
        dealer.setApprovalStatus(ApprovalStatus.APPROVED);
        dealer.setRejectionReason(null);
        return DealerResponse.from(userRepository.save(dealer));
    }

    @Transactional
    public DealerResponse reject(Long dealerId, String reason) {
        User dealer = findDealerOrThrow(dealerId);
        dealer.setApproved(false);
        dealer.setApprovalStatus(ApprovalStatus.REJECTED);
        dealer.setRejectionReason(reason.trim());
        return DealerResponse.from(userRepository.save(dealer));
    }

    private User findDealerOrThrow(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Dealer not found."));
        if (user.getRole() != Role.DEALER) {
            throw ApiException.badRequest("This user is not a dealer.");
        }
        return user;
    }

    private ApprovalStatus parseStatus(String status) {
        try {
            return ApprovalStatus.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw ApiException.badRequest("Invalid status filter. Use PENDING, APPROVED or REJECTED.");
        }
    }
}
