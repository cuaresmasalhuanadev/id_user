package com.biegsfritsstore.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;
import java.time.LocalDateTime;

@Data
@Document(collection = "admins")
public class Admin {

    @Id
    private String id;

    @Indexed(unique = true)
    private String email;

    private String whatsapp;
    private String referralCode;
    private LocalDateTime createdAt;

    public Admin() {
        this.createdAt = LocalDateTime.now();
    }

    public Admin(String email, String whatsapp, String referralCode) {
        this.email = email;
        this.whatsapp = whatsapp;
        this.referralCode = referralCode;
        this.createdAt = LocalDateTime.now();
    }
}
