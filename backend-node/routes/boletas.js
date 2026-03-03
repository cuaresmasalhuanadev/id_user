const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Boleta = require('../models/Boleta');
const moment = require('moment-timezone');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

// ─── Company Info ────────────────────────────────────────────────────────────
const EMPRESA = {
    nombre: 'BIEGS FRITS STORE',
    ruc: '10716673401',
    tipo: 'PERSONA NATURAL CON NEGOCIO',
    propietario: 'VICTOR CUARESMA',
    email: 'biegsfritsstore@gmail.com',
    web: 'https://www.biegsfritsstore.shop',
    telefono: '+51 917 360 503',
    direccion: 'Lima, Perú'
};

// Generar número de boleta único
const generateBoletaNumber = () => {
    const now = moment().tz('America/Lima');
    const fecha = now.format('YYYYMMDD');
    const rand = Math.floor(Math.random() * 9000) + 1000;
    return `BFS-${fecha}-${rand}`;
};

// GET /api/boletas  (admin only)
router.get('/', authMiddleware, async (req, res) => {
    try {
        const boletas = await Boleta.find({ adminId: req.admin.id }).sort({ emitidaEn: -1 });
        res.json({ success: true, data: boletas });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener boletas.' });
    }
});

// POST /api/boletas  (admin only)
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { clienteNombre, clienteWhatsapp, items } = req.body;
        if (!clienteNombre || !items || items.length === 0) {
            return res.status(400).json({ message: 'Nombre del cliente e ítems son requeridos.' });
        }

        let subtotal = 0;
        const processedItems = items.map(item => {
            const sub = parseFloat((item.precioUnit * item.cantidad).toFixed(2));
            subtotal += sub;
            return { ...item, subtotal: sub };
        });

        const igv = parseFloat((subtotal * 0.18).toFixed(2));
        const total = parseFloat((subtotal + igv).toFixed(2));

        const boleta = new Boleta({
            numero: generateBoletaNumber(),
            clienteNombre,
            clienteWhatsapp: clienteWhatsapp || '',
            items: processedItems,
            subtotal, igv, total,
            adminId: req.admin.id,
            emitidaEn: moment().tz('America/Lima').toDate()
        });

        const saved = await boleta.save();
        res.status(201).json({ success: true, data: saved });
    } catch (error) {
        console.error('[Boleta] Error:', error);
        res.status(500).json({ message: 'Error al generar boleta.' });
    }
});

// GET /api/boletas/:id/pdf  (admin only)
router.get('/:id/pdf', authMiddleware, async (req, res) => {
    try {
        const boleta = await Boleta.findById(req.params.id);
        if (!boleta) return res.status(404).json({ message: 'Boleta no encontrada.' });

        const fechaEmision = moment(boleta.emitidaEn).tz('America/Lima').format('DD/MM/YYYY HH:mm [hrs]');

        // Generate QR data
        const qrData = JSON.stringify({
            numero: boleta.numero,
            ruc: EMPRESA.ruc,
            total: boleta.total,
            fecha: fechaEmision,
            cliente: boleta.clienteNombre,
            web: EMPRESA.web
        });
        const qrDataUrl = await QRCode.toDataURL(qrData, {
            width: 150, margin: 1,
            color: { dark: '#1a1a2e', light: '#f5f5f5' }
        });
        // Convert data URL to buffer
        const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');

        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=boleta-${boleta.numero}.pdf`);
        doc.pipe(res);

        const W = 515; // usable width (595 - 2*40)
        const gold = '#D4A017';
        const dark = '#1a1a2e';
        const grey = '#555555';
        const light = '#888888';

        // ── Header strip ──────────────────────────────────────────────
        doc.rect(40, 40, W, 80).fill(dark);

        // Company name
        doc.fontSize(20).font('Helvetica-Bold').fillColor('#F4C430')
            .text(EMPRESA.nombre, 50, 52, { width: 320 });
        doc.fontSize(9).font('Helvetica').fillColor('#a0c0ff')
            .text(`${EMPRESA.tipo}`, 50, 76)
            .text(`Propietario: ${EMPRESA.propietario}`, 50, 89)
            .text(`RUC: ${EMPRESA.ruc}`, 50, 102);

        // QR code (top right inside header)
        const qrX = 430, qrY = 44, qrSize = 70;
        doc.rect(qrX - 3, qrY - 3, qrSize + 6, qrSize + 6).fill('#ffffff');
        doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });

        doc.rect(40, 120, W, 1).fill(gold);

        // ── Boleta title + number ─────────────────────────────────────
        doc.moveDown(0.2);
        let y = 130;
        doc.fontSize(14).font('Helvetica-Bold').fillColor(dark)
            .text('BOLETA DE VENTA ELECTRÓNICA', 40, y, { align: 'center', width: W });
        y += 20;
        doc.fontSize(10).font('Helvetica').fillColor(grey)
            .text(`N°: ${boleta.numero}`, 40, y, { align: 'center', width: W });
        y += 14;
        doc.fontSize(9).fillColor(light)
            .text(`Fecha de emisión: ${fechaEmision} (Hora Lima, Perú)`, 40, y, { align: 'center', width: W });
        y += 20;

        doc.rect(40, y, W, 1).fill('#e0e0e0');
        y += 10;

        // ── Company contact + Client info side by side ────────────────
        const col = W / 2 - 10;
        doc.fontSize(8).font('Helvetica-Bold').fillColor(dark).text('EMISOR', 40, y);
        doc.fontSize(8).font('Helvetica-Bold').fillColor(dark).text('CLIENTE', 40 + col + 20, y);
        y += 12;

        doc.fontSize(8).font('Helvetica').fillColor(grey);
        doc.text(EMPRESA.web, 40, y, { width: col });
        doc.text(EMPRESA.email, 40, y + 11, { width: col });
        doc.text(EMPRESA.telefono, 40, y + 22, { width: col });
        doc.text(EMPRESA.direccion, 40, y + 33, { width: col });

        doc.text(boleta.clienteNombre, 40 + col + 20, y, { width: col });
        if (boleta.clienteWhatsapp) {
            doc.text(`WA: ${boleta.clienteWhatsapp}`, 40 + col + 20, y + 11, { width: col });
        }

        y += 55;
        doc.rect(40, y, W, 1).fill('#e0e0e0');
        y += 10;

        // ── Items table header ────────────────────────────────────────
        doc.rect(40, y, W, 20).fill('#f0f0f0');
        doc.fontSize(8).font('Helvetica-Bold').fillColor(dark);
        doc.text('DESCRIPCIÓN', 44, y + 6, { width: 220 });
        doc.text('CANT.', 270, y + 6, { width: 50, align: 'center' });
        doc.text('P. UNIT.', 330, y + 6, { width: 80, align: 'right' });
        doc.text('SUBTOTAL', 420, y + 6, { width: 90, align: 'right' });

        y += 22;
        doc.font('Helvetica').fillColor(grey);
        let rowAlt = false;
        boleta.items.forEach(item => {
            if (rowAlt) doc.rect(40, y - 3, W, 16).fill('#fafafa');
            rowAlt = !rowAlt;
            doc.fontSize(8).fillColor(dark).text(item.nombre, 44, y, { width: 220 });
            doc.text(String(item.cantidad), 270, y, { width: 50, align: 'center' });
            doc.text(`S/ ${item.precioUnit.toFixed(2)}`, 330, y, { width: 80, align: 'right' });
            doc.fillColor(grey).text(`S/ ${item.subtotal.toFixed(2)}`, 420, y, { width: 90, align: 'right' });
            y += 16;
        });

        y += 6;
        doc.rect(40, y, W, 1).fill('#e0e0e0');
        y += 10;

        // ── Totals ────────────────────────────────────────────────────
        const tX = 350;
        const tW = 200;
        doc.fontSize(9).font('Helvetica').fillColor(grey);
        doc.text('Subtotal (sin IGV):', tX, y, { width: 100 });
        doc.text(`S/ ${boleta.subtotal.toFixed(2)}`, tX + 100, y, { width: 95, align: 'right' });
        y += 14;
        doc.text('IGV (18%):', tX, y, { width: 100 });
        doc.text(`S/ ${boleta.igv.toFixed(2)}`, tX + 100, y, { width: 95, align: 'right' });
        y += 14;

        doc.rect(tX, y, tW, 1).fill(gold);
        y += 6;
        doc.fontSize(12).font('Helvetica-Bold').fillColor(dark);
        doc.text('TOTAL:', tX, y, { width: 100 });
        doc.fillColor(gold).text(`S/ ${boleta.total.toFixed(2)}`, tX + 100, y, { width: 95, align: 'right' });
        y += 24;

        // ── QR legend ────────────────────────────────────────────────
        doc.rect(40, y, W, 1).fill('#e0e0e0');
        y += 10;
        doc.fontSize(7).font('Helvetica').fillColor(light)
            .text(`El código QR contiene los datos de verificación de esta boleta.`, 40, y, { align: 'center', width: W });
        y += 12;

        // ── Footer ────────────────────────────────────────────────────
        doc.rect(40, y, W, 1).fill(gold);
        y += 8;
        doc.fontSize(8).fillColor(dark).font('Helvetica-Bold')
            .text(`Gracias por su compra — ${EMPRESA.nombre}`, 40, y, { align: 'center', width: W });
        doc.fontSize(7).font('Helvetica').fillColor(light)
            .text(`${EMPRESA.web}  ·  ${EMPRESA.email}  ·  RUC: ${EMPRESA.ruc}`, 40, y + 12, { align: 'center', width: W });

        doc.end();
    } catch (error) {
        console.error('[PDF] Error:', error);
        res.status(500).json({ message: 'Error al generar PDF.' });
    }
});

// GET /api/boletas/:id
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const boleta = await Boleta.findById(req.params.id);
        if (!boleta) return res.status(404).json({ message: 'Boleta no encontrada.' });
        res.json({ success: true, data: boleta });
    } catch (error) { res.status(500).json({ message: 'Error al obtener boleta.' }); }
});

// DELETE /api/boletas/:id
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const deleted = await Boleta.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Boleta no encontrada.' });
        res.json({ success: true, message: 'Boleta eliminada.' });
    } catch (error) { res.status(500).json({ message: 'Error al eliminar boleta.' }); }
});

module.exports = router;
