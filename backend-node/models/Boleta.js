const mongoose = require('mongoose');

const BoletaItemSchema = new mongoose.Schema({
    productId: { type: String },
    nombre: { type: String, required: true },
    cantidad: { type: Number, required: true, min: 1 },
    precioUnit: { type: Number, required: true },
    subtotal: { type: Number, required: true }
}, { _id: false });

const BoletaSchema = new mongoose.Schema({
    numero: { type: String, required: true, unique: true },
    clienteNombre: { type: String, required: true },
    clienteWhatsapp: { type: String, default: '' },
    items: [BoletaItemSchema],
    subtotal: { type: Number, required: true },
    igv: { type: Number, required: true },
    total: { type: Number, required: true },
    adminId: { type: String, required: true },
    emitidaEn: { type: Date, default: Date.now }
}, {
    timestamps: true
});

module.exports = mongoose.model('Boleta', BoletaSchema);
