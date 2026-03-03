const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, whatsapp, referralCode } = req.body;

        if (!email || !whatsapp || !referralCode) {
            return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
        }

        // Validate against env credentials
        if (
            email.toLowerCase() !== process.env.ADMIN_EMAIL.toLowerCase() ||
            whatsapp !== process.env.ADMIN_WHATSAPP ||
            referralCode !== process.env.ADMIN_REFERRAL_CODE
        ) {
            return res.status(401).json({ message: 'Credenciales incorrectas. Verifica tus datos.' });
        }

        const admin = await Admin.findOne({ email: email.toLowerCase() });
        if (!admin) {
            return res.status(401).json({ message: 'Administrador no registrado.' });
        }

        const token = jwt.sign(
            { id: admin._id, email: admin.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token,
            expiresIn: 86400,
            admin: {
                id: admin._id,
                email: admin.email,
                whatsapp: admin.whatsapp
            }
        });
    } catch (error) {
        console.error('[Auth] Error:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// GET /api/auth/verify (verify token validity)
router.get('/verify', require('../middleware/auth'), (req, res) => {
    res.json({ valid: true, admin: req.admin });
});

module.exports = router;
