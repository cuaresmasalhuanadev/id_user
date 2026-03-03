package com.biegsfritsstore.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Document(collection = "boletas")
public class Boleta {

    @Id
    private String id;

    private String numero;
    private String clienteNombre;
    private String clienteWhatsapp;
    private List<BoletaItem> items;
    private double subtotal;
    private double igv;
    private double total;
    private String adminId;
    private LocalDateTime emitidaEn;

    @Data
    public static class BoletaItem {
        private String productId;
        private String nombre;
        private int cantidad;
        private double precioUnit;
        private double subtotal;
    }

    public Boleta() {
        this.emitidaEn = LocalDateTime.now();
    }
}
