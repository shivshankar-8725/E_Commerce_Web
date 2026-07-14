package com.emart.entity;

/**
 * Dealer approval lifecycle (Phase 2). Customers and admin are always APPROVED.
 */
public enum ApprovalStatus {
    PENDING,
    APPROVED,
    REJECTED
}
