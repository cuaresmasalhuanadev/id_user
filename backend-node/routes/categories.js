const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Category = require('../models/Category');

// GET /api/categories (public)
router.get('/', async (req, res) => {
    try {
        const cats = await Category.find({ active: true }).sort({ name: 1 });
        res.json({ success: true, data: cats });
    } catch (e) { res.status(500).json({ message: 'Error obteniendo categorías.' }); }
});

// GET /api/categories/admin/all (admin)
router.get('/admin/all', authMiddleware, async (req, res) => {
    try {
        const cats = await Category.find().sort({ name: 1 });
        res.json({ success: true, data: cats });
    } catch (e) { res.status(500).json({ message: 'Error obteniendo categorías.' }); }
});

// POST /api/categories (admin)
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { name, description, icon, color } = req.body;
        if (!name) return res.status(400).json({ message: 'El nombre es obligatorio.' });
        const cat = new Category({ name, description, icon, color });
        const saved = await cat.save();
        res.status(201).json({ success: true, data: saved });
    } catch (e) {
        if (e.code === 11000) return res.status(409).json({ message: 'Ya existe una categoría con ese nombre.' });
        res.status(500).json({ message: 'Error al crear categoría.' });
    }
});

// PUT /api/categories/:id (admin)
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const updated = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) return res.status(404).json({ message: 'Categoría no encontrada.' });
        res.json({ success: true, data: updated });
    } catch (e) { res.status(500).json({ message: 'Error al actualizar.' }); }
});

// DELETE /api/categories/:id (admin)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const deleted = await Category.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Categoría no encontrada.' });
        res.json({ success: true, message: 'Categoría eliminada.' });
    } catch (e) { res.status(500).json({ message: 'Error al eliminar.' }); }
});

module.exports = router;
