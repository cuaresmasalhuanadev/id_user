package com.biegsfritsstore.service;

import com.biegsfritsstore.model.Product;
import com.biegsfritsstore.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    public List<Product> getAllActive() {
        return productRepository.findByActiveTrue();
    }

    public List<Product> getAll() {
        return productRepository.findAll();
    }

    public Optional<Product> getById(String id) {
        return productRepository.findById(id);
    }

    public Product create(Product product) {
        product.setCreatedAt(LocalDateTime.now());
        product.setUpdatedAt(LocalDateTime.now());
        product.setActive(true);
        return productRepository.save(product);
    }

    public Optional<Product> update(String id, Product updatedProduct) {
        return productRepository.findById(id).map(existing -> {
            existing.setName(updatedProduct.getName());
            existing.setDescription(updatedProduct.getDescription());
            existing.setPrice(updatedProduct.getPrice());
            existing.setCategory(updatedProduct.getCategory());
            existing.setImageUrl(updatedProduct.getImageUrl());
            existing.setStock(updatedProduct.getStock());
            existing.setActive(updatedProduct.isActive());
            existing.setUpdatedAt(LocalDateTime.now());
            return productRepository.save(existing);
        });
    }

    public boolean delete(String id) {
        if (productRepository.existsById(id)) {
            productRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
