package com.emart.service;

import com.emart.dto.PincodeRequest;
import com.emart.dto.PincodeResponse;
import com.emart.entity.AllowedPincode;
import com.emart.exception.ApiException;
import com.emart.repository.AllowedPincodeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PincodeService {

    private final AllowedPincodeRepository pincodeRepository;

    public PincodeService(AllowedPincodeRepository pincodeRepository) {
        this.pincodeRepository = pincodeRepository;
    }

    /** P1-CUST-05 / P1-SYS-01: is delivery available to this pincode? */
    public boolean isAllowed(String pincode) {
        return pincode != null && pincodeRepository.existsByPincodeAndIsActiveTrue(pincode.trim());
    }

    public List<PincodeResponse> listAll() {
        return pincodeRepository.findAllByOrderByPincodeAsc()
                .stream().map(PincodeResponse::from).toList();
    }

    @Transactional
    public PincodeResponse create(PincodeRequest req) {
        if (pincodeRepository.findByPincode(req.pincode().trim()).isPresent()) {
            throw ApiException.conflict("This pincode is already in the delivery list.");
        }
        AllowedPincode p = new AllowedPincode();
        p.setPincode(req.pincode().trim());
        p.setArea(req.area());
        p.setActive(req.isActive() == null || req.isActive());
        return PincodeResponse.from(pincodeRepository.save(p));
    }

    @Transactional
    public PincodeResponse update(Long id, PincodeRequest req) {
        AllowedPincode p = pincodeRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Pincode entry not found."));
        p.setPincode(req.pincode().trim());
        p.setArea(req.area());
        if (req.isActive() != null) p.setActive(req.isActive());
        return PincodeResponse.from(pincodeRepository.save(p));
    }

    @Transactional
    public void delete(Long id) {
        if (!pincodeRepository.existsById(id)) {
            throw ApiException.notFound("Pincode entry not found.");
        }
        pincodeRepository.deleteById(id);
    }
}
