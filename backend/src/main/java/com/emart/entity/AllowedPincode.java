package com.emart.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "allowed_pincodes",
        uniqueConstraints = @UniqueConstraint(name = "uk_pincode", columnNames = "pincode"))
public class AllowedPincode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String pincode;

    private String area;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getPincode() { return pincode; }
    public void setPincode(String pincode) { this.pincode = pincode; }

    public String getArea() { return area; }
    public void setArea(String area) { this.area = area; }

    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }
}
