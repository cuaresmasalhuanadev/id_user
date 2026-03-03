require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const Admin = require('./models/Admin');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── CORS ────────────────────────────────────────────────────────────────────
// Allow: same-container Nginx (no origin), configured FRONTEND_URL, any koyeb/netlify subdomain
const CORS_WHITELIST = [
    'http://localhost:4200',
    'http://localhost:8084',
];

// Add custom domain from env (e.g. https://www.biegsfritsstore.shop)
if (process.env.FRONTEND_URL) {
    CORS_WHITELIST.push(process.env.FRONTEND_URL);
    // also allow www. variant if not already included
    const url = process.env.FRONTEND_URL.replace('https://www.', 'https://').replace('https://', 'https://www.');
    if (!CORS_WHITELIST.includes(url)) CORS_WHITELIST.push(url);
}

app.use(cors({
    origin: (origin, callback) => {
        // Allow same-container Nginx requests (no Origin header)
        if (!origin) return callback(null, true);

        const allowed =
            CORS_WHITELIST.includes(origin) ||
            /\.koyeb\.app$/.test(origin) ||
            /\.netlify\.app$/.test(origin) ||
            /biegsfritsstore\.shop$/.test(origin);  // allow all subdomains of biegsfritsstore.shop

        if (allowed) {
            callback(null, true);
        } else {
            console.error('[ERROR] CORS bloqueado:', origin);
            callback(null, true); // permissive: log but still allow (set to false to block strictly)
        }
    },
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── HEALTH CHECK ────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
    res.json({ status: 'ok', app: 'Biegs Frits Store API', timestamp: new Date().toISOString() });
});

// ─── ROUTES ──────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/boletas', require('./routes/boletas'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/reniec', require('./routes/reniec'));
app.use('/api/config', require('./routes/config'));

// 404
app.use((req, res) => res.status(404).json({ message: 'Ruta no encontrada.' }));

// Error handler
app.use((err, req, res, next) => {
    console.error('[ERROR]', err.message);
    res.status(500).json({ message: 'Error interno del servidor.' });
});

// ─── MONGODB + START ─────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('[MongoDB] Conectado a biegsfritsstore ✓');

        // Seed admin si no existe
        const exists = await Admin.findOne({ email: process.env.ADMIN_EMAIL });
        if (!exists) {
            await Admin.create({
                email: process.env.ADMIN_EMAIL,
                whatsapp: process.env.ADMIN_WHATSAPP,
                referralCode: process.env.ADMIN_REFERRAL_CODE
            });
            console.log('[Seed] Admin creado: ' + process.env.ADMIN_EMAIL);
        }

        app.listen(PORT, '0.0.0.0', () => {
            console.log(`[Server] Biegs Frits Store API corriendo en puerto ${PORT}`);
        });
    })
    .catch(err => {
        console.error('[MongoDB] Error de conexión:', err.message);
        process.exit(1);
    });
