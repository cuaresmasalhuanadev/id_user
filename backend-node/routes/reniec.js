const express = require('express');
const router = express.Router();
const https = require('https');
const http = require('http');
const authMiddleware = require('../middleware/auth');
const Config = require('../models/Config');

// ─── Helper ────────────────────────────────────────────────────────
function httpFetch(url, options = {}) {
    return new Promise((resolve, reject) => {
        const parsed = new URL(url);
        const lib = parsed.protocol === 'https:' ? https : http;
        const req = lib.request({
            hostname: parsed.hostname,
            path: parsed.pathname + parsed.search,
            method: options.method || 'GET',
            headers: options.headers || {}
        }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
                catch { resolve({ status: res.statusCode, body: data }); }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

// ─── Provider: Decolecta ───────────────────────────────────────────
async function consultarDecolecta(dni, token) {
    const url = `https://api.decolecta.com/v1/reniec/dni?numero=${dni}`;
    const result = await httpFetch(url, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    });
    if (result.status === 200) {
        const d = result.body;
        return {
            id: d.document_number,
            nombres: d.first_name,
            apellido_paterno: d.first_last_name,
            apellido_materno: d.second_last_name,
            nombre_completo: d.full_name,
            document_number: d.document_number,
            genero: null, fecha_nacimiento: null, codigo_verificacion: null
        };
    }
    return { error: result.status, body: result.body };
}

// ─── Provider: PeruDevs ────────────────────────────────────────────
async function consultarPeruDevs(dni, token) {
    const url = `https://api.perudevs.com/api/v1/dni/complete?document=${dni}&key=${token}`;
    const result = await httpFetch(url, { headers: { 'Content-Type': 'application/json' } });
    if (result.status === 200 && result.body.estado) {
        // Try nested resultado, fallback to direct body
        const r = result.body.resultado || result.body;
        return {
            id: r.id || r.document_number || dni,
            nombres: r.nombres || r.first_name || '',
            apellido_paterno: r.apellido_paterno || r.paterno || r.last_name || '',
            apellido_materno: r.apellido_materno || r.materno || r.second_last_name || '',
            nombre_completo: r.nombre_completo || r.full_name ||
                [r.nombres || r.first_name || '', r.apellido_paterno || '', r.apellido_materno || ''].join(' ').trim(),
            document_number: r.id || r.document_number || dni,
            genero: r.genero || r.sexo || r.gender || null,
            fecha_nacimiento: r.fecha_nacimiento || r.birthdate || null,
            codigo_verificacion: r.codigo_verificacion || r.codigo || null
        };
    }
    return { error: result.status, body: result.body };
}

// ─── POST /api/reniec/consultar (admin only) ───────────────────────
router.post('/consultar', authMiddleware, async (req, res) => {
    try {
        const { dni, provider = 'perudevs' } = req.body;
        if (!dni || !/^\d{8}$/.test(dni)) {
            return res.status(400).json({ message: 'DNI inválido. Debe tener exactamente 8 dígitos.' });
        }
        const tokenKey = provider === 'decolecta' ? 'reniec_token_decolecta' : 'reniec_token_perudevs';
        const cfg = await Config.findOne({ key: tokenKey });
        if (!cfg?.value) {
            return res.status(503).json({ message: `Token de ${provider === 'decolecta' ? 'Decolecta' : 'PeruDevs'} no configurado.` });
        }
        const result = provider === 'decolecta'
            ? await consultarDecolecta(dni, cfg.value)
            : await consultarPeruDevs(dni, cfg.value);

        if (result.error) {
            if (result.error === 401 || result.error === 403)
                return res.status(401).json({ message: 'Token inválido o expirado.' });
            if (result.error === 404)
                return res.status(404).json({ message: `DNI ${dni} no encontrado.` });
            return res.status(502).json({ message: 'Error en la API RENIEC.', detail: result.body });
        }
        res.json({ success: true, data: result, provider });
    } catch (e) {
        res.status(500).json({ message: 'Error de conexión con la API RENIEC.' });
    }
});

// ─── GET /api/reniec/token-status (admin only) ─────────────────────
router.get('/token-status', authMiddleware, async (req, res) => {
    try {
        const [dec, peru] = await Promise.all([
            Config.findOne({ key: 'reniec_token_decolecta' }),
            Config.findOne({ key: 'reniec_token_perudevs' })
        ]);
        res.json({
            success: true,
            decolecta: { configured: !!(dec?.value), notes: dec?.notes || '', updatedAt: dec?.updatedAt || null },
            perudevs: { configured: !!(peru?.value), notes: peru?.notes || '', updatedAt: peru?.updatedAt || null }
        });
    } catch (e) { res.status(500).json({ message: 'Error.' }); }
});

// ─── POST /api/reniec/public (public — no auth) ────────────────────
// body: { dni, provider? } — 'perudevs' | 'decolecta' | undefined(auto)
router.post('/public', async (req, res) => {
    try {
        const { dni, provider } = req.body;
        if (!dni || !/^\d{8}$/.test(dni)) {
            return res.status(400).json({ message: 'DNI inválido. Debe tener exactamente 8 dígitos.' });
        }

        let result = null;
        let usedProvider = null;

        if (provider === 'perudevs' || !provider) {
            const cfg = await Config.findOne({ key: 'reniec_token_perudevs' });
            if (cfg?.value) {
                result = await consultarPeruDevs(dni, cfg.value);
                if (result.error) { result = null; }
                else { usedProvider = 'perudevs'; }
            }
        }

        if (!result && (provider === 'decolecta' || !provider)) {
            const cfg = await Config.findOne({ key: 'reniec_token_decolecta' });
            if (cfg?.value) {
                result = await consultarDecolecta(dni, cfg.value);
                if (result.error) { result = null; }
                else { usedProvider = 'decolecta'; }
            }
        }

        if (!result) {
            return res.status(503).json({ message: 'Servicio de consulta no disponible temporalmente.' });
        }
        res.json({ success: true, data: result, provider: usedProvider });
    } catch (e) {
        console.error('[RENIEC/public] Error:', e.message);
        res.status(500).json({ message: 'Error al consultar el DNI.' });
    }
});

module.exports = router;
