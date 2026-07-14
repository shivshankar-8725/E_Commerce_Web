package com.emart.dto;

import com.emart.entity.AllowedPincode;

public record PincodeResponse(
        Long id,
        String pincode,
        String area,
        boolean isActive
) {
    public static PincodeResponse from(AllowedPincode p) {
        return new PincodeResponse(p.getId(), p.getPincode(), p.getArea(), p.isActive());
    }
}
