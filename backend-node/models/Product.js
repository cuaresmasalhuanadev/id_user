const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },        // precio base SIN IGV
    category: { type: String, default: 'General' },
    imageUrl: { type: String, default: '' },
    stock: { type: Number, default: 0, min: 0 },
    active: { type: Boolean, default: true },
    coupon: { type: String, default: '' },                   // código de cupón (15% off)
    tipoDuracion: { type: String, enum: ['NINGUNO', 'MES', 'ANUAL'], default: 'NINGUNO' }
}, {
    timestamps: true
});

module.exports = mongoose.model('Product', ProductSchema);
