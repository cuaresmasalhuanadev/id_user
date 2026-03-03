const mongoose = require('mongoose');

// Stores global configuration key-value pairs (e.g. API tokens)
const ConfigSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    value: { type: String, default: '' },
    label: { type: String, default: '' },  // Human-readable label for the UI
    notes: { type: String, default: '' }   // Usage notes / limits
}, { timestamps: true });

module.exports = mongoose.model('Config', ConfigSchema);
