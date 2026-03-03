const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Config = require('../models/Config');

// GET /api/config  (admin only)
router.get('/', authMiddleware, async (req, res) => {
    try {
        const configs = await Config.find().sort({ key: 1 });
        res.json({ success: true, data: configs });
    } catch (e) { res.status(500).json({ message: 'Error obteniendo configuración.' }); }
});

// PUT /api/config/:key  (admin only) — upsert by key
router.put('/:key', authMiddleware, async (req, res) => {
    try {
        const { value, label, notes } = req.body;
        const updated = await Config.findOneAndUpdate(
            { key: req.params.key },
            { value, label, notes },
            { upsert: true, new: true }
        );
        res.json({ success: true, data: updated });
    } catch (e) { res.status(500).json({ message: 'Error al guardar configuración.' }); }
});

// DELETE /api/config/:key  (admin only)
router.delete('/:key', authMiddleware, async (req, res) => {
    try {
        await Config.findOneAndDelete({ key: req.params.key });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ message: 'Error al eliminar configuración.' }); }
});

module.exports = router;
