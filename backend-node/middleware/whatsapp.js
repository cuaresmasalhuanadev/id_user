/**
 * Validates WhatsApp numbers for South American countries and USA/Canada
 * Supported prefixes:
 * +1  (USA/Canada), +51 (Peru), +52 (Mexico), +54 (Argentina),
 * +55 (Brazil), +56 (Chile), +57 (Colombia), +58 (Venezuela),
 * +591 (Bolivia), +593 (Ecuador), +595 (Paraguay), +598 (Uruguay)
 */
const VALID_PREFIXES = ['+1', '+51', '+52', '+54', '+55', '+56', '+57', '+58', '+591', '+593', '+595', '+598'];

const validateWhatsApp = (number) => {
    if (!number || typeof number !== 'string') return false;

    // Must start with +, only digits after
    const clean = number.trim();
    if (!/^\+\d+$/.test(clean)) return false;

    // Check valid prefix
    const hasValidPrefix = VALID_PREFIXES.some(prefix => clean.startsWith(prefix));
    if (!hasValidPrefix) return false;

    // Length check: between 8 and 15 digits total (including country code)
    const digits = clean.slice(1); // remove +
    return digits.length >= 8 && digits.length <= 15;
};

module.exports = { validateWhatsApp, VALID_PREFIXES };
