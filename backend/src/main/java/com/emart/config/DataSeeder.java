package com.emart.config;

import com.emart.entity.*;
import com.emart.repository.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * Seeds the single ADMIN account (P1-AUTH-03 — admin can never be created via public signup),
 * a starter delivery area, and a few demo categories/products on first boot.
 * Everything is idempotent: it only inserts what is missing.
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final AllowedPincodeRepository pincodeRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.name}")        private String adminName;
    @Value("${app.admin.mobile}")      private String adminMobile;
    @Value("${app.admin.email}")       private String adminEmail;
    @Value("${app.admin.password}")    private String adminPassword;

    public DataSeeder(UserRepository userRepository, CategoryRepository categoryRepository,
                      ProductRepository productRepository, AllowedPincodeRepository pincodeRepository,
                      PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
        this.pincodeRepository = pincodeRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        seedAdmin();
        seedPincodes();
        seedCatalogue();
        seedDemoDealer();
    }

    private void seedAdmin() {
        if (userRepository.existsByMobile(adminMobile)) return;
        User admin = new User();
        admin.setName(adminName);
        admin.setMobile(adminMobile);
        admin.setEmail(adminEmail);
        admin.setPasswordHash(passwordEncoder.encode(adminPassword));
        admin.setRole(Role.ADMIN);
        admin.setApproved(true);
        admin.setApprovalStatus(ApprovalStatus.APPROVED);
        userRepository.save(admin);
        System.out.println("[seed] Admin created -> mobile: " + adminMobile + " / password: " + adminPassword);
    }

    /** A demo dealer left PENDING so the approval flow (P2-DEAL-02) can be tested immediately. */
    private void seedDemoDealer() {
        String dealerMobile = "8888888888";
        if (userRepository.existsByMobile(dealerMobile)) return;
        User dealer = new User();
        dealer.setName("Demo Dealer");
        dealer.setMobile(dealerMobile);
        dealer.setEmail("dealer@emart.local");
        dealer.setPasswordHash(passwordEncoder.encode("Dealer@123"));
        dealer.setRole(Role.DEALER);
        dealer.setShopName("Sharma Kirana Store");
        dealer.setContactPerson("Demo Dealer");
        dealer.setGstNumber("22AAAAA0000A1Z5");
        dealer.setApproved(false);
        dealer.setApprovalStatus(ApprovalStatus.PENDING);
        userRepository.save(dealer);
        System.out.println("[seed] Pending demo dealer -> mobile: " + dealerMobile + " / password: Dealer@123");
    }

    private void seedPincodes() {
        if (pincodeRepository.count() > 0) return;
        addPincode("452001", "Indore - Rajwada");
        addPincode("452010", "Indore - Vijay Nagar");
        addPincode("462001", "Bhopal - MP Nagar");
    }

    private void addPincode(String code, String area) {
        AllowedPincode p = new AllowedPincode();
        p.setPincode(code);
        p.setArea(area);
        p.setActive(true);
        pincodeRepository.save(p);
    }

    private void seedCatalogue() {
        if (categoryRepository.count() > 0 || productRepository.count() > 0) return;

        Category chips = newCategory("Chips");
        Category namkeen = newCategory("Namkeen");
        Category snacks = newCategory("Snacks");

        newProduct("Classic Salted Potato Chips", "Crispy salted potato chips.", chips,
                new BigDecimal("20.00"), new BigDecimal("15.00"), "50g", 100);
        newProduct("Masala Potato Chips", "Spicy Indian masala flavour.", chips,
                new BigDecimal("20.00"), new BigDecimal("15.00"), "50g", 80);
        newProduct("Aloo Bhujia", "Classic spicy potato bhujia.", namkeen,
                new BigDecimal("45.00"), new BigDecimal("36.00"), "200g", 60);
        newProduct("Moong Dal", "Roasted and salted moong dal.", namkeen,
                new BigDecimal("50.00"), new BigDecimal("40.00"), "200g", 0); // out of stock demo
        newProduct("Cheese Balls", "Crunchy cheese flavoured corn puffs.", snacks,
                new BigDecimal("30.00"), new BigDecimal("24.00"), "60g", 40);
    }

    private Category newCategory(String name) {
        Category c = new Category();
        c.setName(name);
        c.setActive(true);
        return categoryRepository.save(c);
    }

    private void newProduct(String name, String desc, Category category, BigDecimal retail,
                            BigDecimal wholesale, String weight, int stock) {
        Product p = new Product();
        p.setName(name);
        p.setDescription(desc);
        p.setCategory(category);
        p.setRetailPrice(retail);
        p.setWholesalePrice(wholesale);
        p.setWeight(weight);
        p.setStockQty(stock);
        p.setActive(true);
        productRepository.save(p);
    }
}
