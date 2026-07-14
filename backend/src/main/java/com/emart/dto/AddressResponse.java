package com.emart.dto;

import com.emart.entity.Address;

public record AddressResponse(
        Long id,
        String line1,
        String city,
        String pincode,
        String phone
) {
    public static AddressResponse from(Address a) {
        return new AddressResponse(a.getId(), a.getLine1(), a.getCity(), a.getPincode(), a.getPhone());
    }
}
