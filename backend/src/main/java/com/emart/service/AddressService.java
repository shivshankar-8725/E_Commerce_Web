package com.emart.service;

import com.emart.dto.AddressRequest;
import com.emart.dto.AddressResponse;
import com.emart.entity.Address;
import com.emart.entity.User;
import com.emart.exception.ApiException;
import com.emart.repository.AddressRepository;
import com.emart.repository.OrderRepository;
import com.emart.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AddressService {

    private final AddressRepository addressRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;

    public AddressService(AddressRepository addressRepository, UserRepository userRepository,
                          OrderRepository orderRepository) {
        this.addressRepository = addressRepository;
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
    }

    /** P1-CUST-05: saved addresses for reuse. */
    public List<AddressResponse> listForUser(Long userId) {
        return addressRepository.findByUserIdOrderByIdDesc(userId)
                .stream().map(AddressResponse::from).toList();
    }

    @Transactional
    public AddressResponse create(Long userId, AddressRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("User not found."));
        Address a = new Address();
        a.setUser(user);
        a.setLine1(req.line1().trim());
        a.setCity(req.city().trim());
        a.setPincode(req.pincode().trim());
        a.setPhone(req.phone().trim());
        return AddressResponse.from(addressRepository.save(a));
    }

    // An address can't be edited only while an order using it is OUT FOR DELIVERY.
    // (Each order keeps its own address snapshot, so editing is otherwise always safe.)
    private static final java.util.List<com.emart.entity.OrderStatus> LOCK_EDIT_STATUSES =
            java.util.List.of(com.emart.entity.OrderStatus.OUT_FOR_DELIVERY);

    /** Edit a saved address (owner only). */
    @Transactional
    public AddressResponse update(Long userId, Long addressId, AddressRequest req) {
        Address a = getOwnedOrThrow(userId, addressId);
        if (orderRepository.existsByAddressIdAndStatusIn(addressId, LOCK_EDIT_STATUSES)) {
            throw ApiException.badRequest(
                    "This address is linked to an order that is out for delivery and can no longer be edited.");
        }
        a.setLine1(req.line1().trim());
        a.setCity(req.city().trim());
        a.setPincode(req.pincode().trim());
        a.setPhone(req.phone().trim());
        return AddressResponse.from(addressRepository.save(a));
    }

    /** Delete a saved address (owner only). Blocked if an order already uses it. */
    @Transactional
    public void delete(Long userId, Long addressId) {
        Address a = getOwnedOrThrow(userId, addressId);
        if (orderRepository.existsByAddressId(addressId)) {
            throw ApiException.badRequest("This address is used by an order and cannot be deleted.");
        }
        addressRepository.delete(a);
    }

    /** Returns the address only if it belongs to the given user. */
    public Address getOwnedOrThrow(Long userId, Long addressId) {
        Address a = addressRepository.findById(addressId)
                .orElseThrow(() -> ApiException.notFound("Address not found."));
        if (!a.getUser().getId().equals(userId)) {
            throw ApiException.forbidden("This address does not belong to you.");
        }
        return a;
    }
}
