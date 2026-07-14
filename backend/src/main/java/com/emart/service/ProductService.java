package com.emart.service;

import com.emart.dto.ProductRequest;
import com.emart.dto.ProductResponse;
import com.emart.entity.Category;
import com.emart.entity.Product;
import com.emart.exception.ApiException;
import com.emart.repository.CategoryRepository;
import com.emart.repository.ProductRepository;
import com.emart.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    public ProductService(ProductRepository productRepository, CategoryRepository categoryRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
    }

    /**
     * P1-CUST-01/02 + P2-DEAL-03: active products, optional category + name search.
     * Pricing is role-aware: approved dealers see wholesale, everyone else sees retail only.
     */
    @Transactional(readOnly = true)
    public List<ProductResponse> listForCustomers(Long categoryId, String search) {
        String q = StringUtils.hasText(search) ? search.trim() : null;
        boolean dealer = isDealerViewer();
        return productRepository.searchActive(categoryId, q)
                .stream()
                .map(p -> dealer ? ProductResponse.forDealer(p) : ProductResponse.forCustomer(p))
                .toList();
    }

    /** P1-CUST-03 + P2-DEAL-03: product detail with role-aware pricing. */
    @Transactional(readOnly = true)
    public ProductResponse getForCustomer(Long id) {
        Product p = productRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Product not found."));
        if (!p.isActive()) {
            throw ApiException.notFound("Product not found.");
        }
        return isDealerViewer() ? ProductResponse.forDealer(p) : ProductResponse.forCustomer(p);
    }

    // A DEALER token only exists for approved dealers (login is blocked otherwise),
    // so a DEALER viewer is always an approved dealer.
    private boolean isDealerViewer() {
        return "DEALER".equals(SecurityUtils.currentRoleOrNull());
    }

    /** Admin: full list. */
    @Transactional(readOnly = true)
    public List<ProductResponse> listAll() {
        return productRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(ProductResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public ProductResponse getById(Long id) {
        return ProductResponse.from(findOrThrow(id));
    }

    @Transactional
    public ProductResponse create(ProductRequest req) {
        Product p = new Product();
        apply(p, req);
        return ProductResponse.from(productRepository.save(p));
    }

    @Transactional
    public ProductResponse update(Long id, ProductRequest req) {
        Product p = findOrThrow(id);
        apply(p, req);
        return ProductResponse.from(productRepository.save(p));
    }

    /** P1-ADMIN-01: prefer deactivate over hard delete. */
    @Transactional
    public ProductResponse deactivate(Long id) {
        Product p = findOrThrow(id);
        p.setActive(false);
        return ProductResponse.from(productRepository.save(p));
    }

    /** P1-ADMIN-02: set stock; 0 means out-of-stock (surfaced via inStock flag). */
    @Transactional
    public ProductResponse setStock(Long id, int stockQty) {
        if (stockQty < 0) throw ApiException.badRequest("Stock quantity cannot be negative.");
        Product p = findOrThrow(id);
        p.setStockQty(stockQty);
        return ProductResponse.from(productRepository.save(p));
    }

    private void apply(Product p, ProductRequest req) {
        p.setName(req.name().trim());
        p.setDescription(req.description());
        p.setImageUrl(req.imageUrl());
        p.setRetailPrice(req.retailPrice());
        p.setWholesalePrice(req.wholesalePrice());
        p.setWeight(req.weight());
        p.setStockQty(req.stockQty());
        p.setActive(req.isActive() == null || req.isActive());

        if (req.categoryId() != null) {
            Category category = categoryRepository.findById(req.categoryId())
                    .orElseThrow(() -> ApiException.badRequest("Selected category does not exist."));
            p.setCategory(category);
        } else {
            p.setCategory(null);
        }
    }

    private Product findOrThrow(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Product not found."));
    }
}
