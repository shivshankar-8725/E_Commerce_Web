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

        Category it = newCategory("IT Solutions");
        Category grocery = newCategory("Grocery");
        Category agriculture = newCategory("Agriculture");
        Category medical = newCategory("Medical");
        Category realEstate = newCategory("Real Estate");

        // IT Solutions
        newProduct("Custom Web Application Development", "Professional full-stack web application development tailored to your business needs, using React and Spring Boot.", it,
                new BigDecimal("45000.00"), new BigDecimal("40000.00"), "1 Project", 99);
        newProduct("Cloud Infrastructure Setup", "Secure and scalable cloud setup on AWS/Azure, including CI/CD pipelines, containerization with Docker, and monitoring.", it,
                new BigDecimal("25000.00"), new BigDecimal("20000.00"), "1 Setup", 99);
        newProduct("Enterprise IT Consultancy", "Consulting services for digital transformation, system architecture design, and IT infrastructure security audit.", it,
                new BigDecimal("15000.00"), new BigDecimal("12000.00"), "1 Session", 99);

        // Grocery
        newProduct("Premium Basmati Rice", "Long-grain aromatic basmati rice, aged to perfection, ideal for biryani and daily luxury dining.", grocery,
                new BigDecimal("120.00"), new BigDecimal("95.00"), "5 kg", 150);
        newProduct("Organic Cold Pressed Mustard Oil", "100% pure and organic cold-pressed mustard oil, high in antioxidants and rich in natural aroma.", grocery,
                new BigDecimal("210.00"), new BigDecimal("180.00"), "1 L", 120);
        newProduct("Pure Himalayan Pink Salt", "Mineral-rich pink salt sourced directly from the Himalayas, perfect for healthy cooking and seasoning.", grocery,
                new BigDecimal("90.00"), new BigDecimal("75.00"), "1 kg", 200);

        // Agriculture
        newProduct("Organic NPK Fertilizer", "Eco-friendly bio-fertilizer rich in Nitrogen, Phosphorus, and Potassium to boost crop yield and soil health.", agriculture,
                new BigDecimal("350.00"), new BigDecimal("280.00"), "10 kg", 80);
        newProduct("Hybrid Tomato Seeds", "High-yield, disease-resistant hybrid tomato seeds suitable for both polyhouse and open-field farming.", agriculture,
                new BigDecimal("150.00"), new BigDecimal("120.00"), "50g Pack", 300);
        newProduct("Automatic Drip Irrigation Kit", "Complete smart drip irrigation system kit with emitters, pipes, and connectors for precise water supply to plants.", agriculture,
                new BigDecimal("1800.00"), new BigDecimal("1450.00"), "1 Unit", 0); // Out of stock demo

        // Medical
        newProduct("Digital Blood Pressure Monitor", "Fully automatic upper arm blood pressure monitor with large LCD display and irregular heartbeat detection.", medical,
                new BigDecimal("1999.00"), new BigDecimal("1600.00"), "1 Unit", 100);
        newProduct("N95 Protective Face Masks", "High-filtration N95 face masks with comfortable earloops, offering 95% efficiency against airborne particles.", medical,
                new BigDecimal("250.00"), new BigDecimal("180.00"), "Pack of 10", 500);
        newProduct("Premium First Aid Kit", "Comprehensive medical first aid kit containing bandages, antiseptics, scissors, and emergency essentials.", medical,
                new BigDecimal("450.00"), new BigDecimal("360.00"), "1 Kit", 150);

        // Real Estate
        newProduct("Commercial Shop Lease Consulting", "Assistance in finding, verifying legal docs, and negotiating leasing terms for premium commercial shops.", realEstate,
                new BigDecimal("10000.00"), new BigDecimal("8000.00"), "1 Shop", 99);
        newProduct("Premium Residential Apartment Booking", "Token amount for booking premium 3 BHK residential apartments located in prime urban spaces with luxury amenities.", realEstate,
                new BigDecimal("50000.00"), new BigDecimal("45000.00"), "Booking Fee", 20);
        newProduct("Farmland Plot Valuation Report", "Detailed survey, mapping, soil checking, and market valuation report for agricultural and farmland properties.", realEstate,
                new BigDecimal("5000.00"), new BigDecimal("4000.00"), "1 Survey", 40);
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
