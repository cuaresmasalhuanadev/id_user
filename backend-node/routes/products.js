const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Product = require('../models/Product');

// GET /api/products  (público - clientes ven el catálogo)
router.get('/', async (req, res) => {
    try {
        const { category, all } = req.query;
        let filter = { active: true };
        if (category) filter.category = category;

        const products = await Product.find(filter).sort({ createdAt: -1 });
        res.json({ success: true, data: products });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener productos.' });
    }
});

// GET /api/products/admin/all  (admin - ve todos incluyendo inactivos)
router.get('/admin/all', authMiddleware, async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.json({ success: true, data: products });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener productos.' });
    }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Producto no encontrado.' });
        res.json({ success: true, data: product });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener producto.' });
    }
});

// POST /api/products  (admin only)
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { name, description, price, category, imageUrl, stock } = req.body;
        if (!name || price === undefined) {
            return res.status(400).json({ message: 'Nombre y precio son obligatorios.' });
        }

        const product = new Product({ name, description, price, category, imageUrl, stock });
        const saved = await product.save();
        res.status(201).json({ success: true, data: saved });
    } catch (error) {
        res.status(500).json({ message: 'Error al crear producto.' });
    }
});

// PUT /api/products/:id  (admin only)
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const updated = await Product.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: new Date() },
            { new: true, runValidators: true }
        );
        if (!updated) return res.status(404).json({ message: 'Producto no encontrado.' });
        res.json({ success: true, data: updated });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar producto.' });
    }
});

// DELETE /api/products/:id  (admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const deleted = await Product.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Producto no encontrado.' });
        res.json({ success: true, message: 'Producto eliminado.' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar producto.' });
    }
});

module.exports = router;
