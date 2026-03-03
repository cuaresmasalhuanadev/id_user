package com.biegsfritsstore.repository;

import com.biegsfritsstore.model.Boleta;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface BoletaRepository extends MongoRepository<Boleta, String> {
    List<Boleta> findByAdminIdOrderByEmitidaEnDesc(String adminId);
}
