/**
 * otpService.js
 *
 * Almacén de OTP en memoria para verificación 2FA.
 * Los códigos son de 6 dígitos, válidos por 30 segundos, de un solo uso.
 *
 * En producción, reemplace el paso `send` por envío de email/SMS
 * y elimine el campo `code` de la respuesta de la API.
 */

/** @type {Map<string, { code: string, expiresAt: number }>} */
const otpStore = new Map();

const OTP_TTL_MS = 30_000; // 30 segundos

/**
 * Genera un OTP de 6 dígitos para un usuario dado y lo almacena.
 * Sobrescribe cualquier OTP pendiente existente para el mismo usuario.
 *
 * @param {string} userId
 * @returns {{ code: string, expiresIn: number }} expiresIn en segundos
 */
function generate(userId) {
    // Eliminar cualquier OTP existente para este usuario
    otpStore.delete(userId);

    // Limpiar entradas expiradas periódicamente
    _cleanup();

    const code = String(Math.floor(100000 + Math.random() * 900000)); // 6 dígitos
    const expiresAt = Date.now() + OTP_TTL_MS;

    otpStore.set(userId, { code, expiresAt });

    return { code, expiresIn: OTP_TTL_MS / 1000 };
}

/**
 * Verifica un OTP de 6 dígitos para un usuario dado.
 * El OTP se consume (elimina) tras la primera verificación exitosa.
 *
 * @param {string} userId
 * @param {string} code
 * @returns {{ valid: boolean, reason?: string }}
 */
function verify(userId, code) {
    const entry = otpStore.get(userId);

    if (!entry) {
        return { valid: false, reason: 'No pending OTP for this user. Request a new code.' };
    }

    if (Date.now() > entry.expiresAt) {
        otpStore.delete(userId);
        return { valid: false, reason: 'OTP has expired. Request a new code.' };
    }

    if (entry.code !== String(code)) {
        return { valid: false, reason: 'Invalid OTP code.' };
    }

    // Consumir el OTP — de un solo uso
    otpStore.delete(userId);
    return { valid: true };
}

/** Elimina todas las entradas caducadas del almacén. */
function _cleanup() {
    const now = Date.now();
    for (const [userId, entry] of otpStore.entries()) {
        if (now > entry.expiresAt) otpStore.delete(userId);
    }
}

module.exports = { generate, verify };
