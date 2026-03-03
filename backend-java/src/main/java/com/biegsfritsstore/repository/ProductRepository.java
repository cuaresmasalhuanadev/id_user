package com.biegsfritsstore.repository;

import com.biegsfritsstore.model.Product;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface ProductRepository extends MongoRepository<Product, String> {
    List<Product> findByActiveTrue();
    List<Product> findByCategory(String category);
}
