package com.emart.dto;

import com.emart.entity.User;

import java.time.Instant;

public record DealerResponse(
        Long id,
        String name,
        String mobile,
        String email,
        String shopName,
        String contactPerson,
        String gstNumber,
        String approvalStatus,
        String rejectionReason,
        Instant createdAt
) {
    public static DealerResponse from(User u) {
        return new DealerResponse(
                u.getId(),
                u.getName(),
                u.getMobile(),
                u.getEmail(),
                u.getShopName(),
                u.getContactPerson(),
                u.getGstNumber(),
                u.getApprovalStatus() != null ? u.getApprovalStatus().name() : null,
                u.getRejectionReason(),
                u.getCreatedAt()
        );
    }
}
