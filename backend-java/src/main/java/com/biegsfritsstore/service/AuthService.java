package com.biegsfritsstore.service;

import com.biegsfritsstore.model.Admin;
import com.biegsfritsstore.repository.AdminRepository;
import com.biegsfritsstore.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Value("${admin.email}")
    private String adminEmail;

    @Value("${admin.whatsapp}")
    private String adminWhatsapp;

    @Value("${admin.referralCode}")
    private String adminReferralCode;

    public Map<String, Object> login(String email, String whatsapp, String referralCode) {
        Map<String, Object> result = new HashMap<>();

        // Validar credenciales exactas
        if (!adminEmail.equals(email)) {
            result.put("success", false);
            result.put("message", "Credenciales incorrectas.");
            return result;
        }
        if (!adminWhatsapp.equals(whatsapp)) {
            result.put("success", false);
            result.put("message", "Credenciales incorrectas.");
            return result;
        }
        if (!adminReferralCode.equals(referralCode)) {
            result.put("success", false);
            result.put("message", "Código de referido incorrecto.");
            return result;
        }

        // Buscar admin en BD
        Optional<Admin> adminOpt = adminRepository.findByEmail(email);
        if (adminOpt.isEmpty()) {
            result.put("success", false);
            result.put("message", "Administrador no registrado en el sistema.");
            return result;
        }

        String token = jwtUtil.generateToken(email);
        result.put("success", true);
        result.put("token", token);
        result.put("expiresIn", 86400);
        result.put("admin", adminOpt.get());
        return result;
    }
}
