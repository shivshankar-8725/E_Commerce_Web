package com.emart.service;

import com.emart.dto.CategoryRequest;
import com.emart.dto.CategoryResponse;
import com.emart.entity.Category;
import com.emart.exception.ApiException;
import com.emart.repository.CategoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    /** Customer-facing: active categories only. */
    public List<CategoryResponse> listActive() {
        return categoryRepository.findByIsActiveTrueOrderByNameAsc()
                .stream().map(CategoryResponse::from).toList();
    }

    /** Admin: all categories. */
    public List<CategoryResponse> listAll() {
        return categoryRepository.findAll()
                .stream().map(CategoryResponse::from).toList();
    }

    @Transactional
    public CategoryResponse create(CategoryRequest req) {
        if (categoryRepository.existsByNameIgnoreCase(req.name().trim())) {
            throw ApiException.conflict("A category with this name already exists.");
        }
        Category c = new Category();
        c.setName(req.name().trim());
        c.setActive(req.isActive() == null || req.isActive());
        return CategoryResponse.from(categoryRepository.save(c));
    }

    @Transactional
    public CategoryResponse update(Long id, CategoryRequest req) {
        Category c = categoryRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Category not found."));
        c.setName(req.name().trim());
        if (req.isActive() != null) c.setActive(req.isActive());
        return CategoryResponse.from(categoryRepository.save(c));
    }

    /** Deactivate (soft) rather than hard delete. */
    @Transactional
    public CategoryResponse deactivate(Long id) {
        Category c = categoryRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Category not found."));
        c.setActive(false);
        return CategoryResponse.from(categoryRepository.save(c));
    }
}
