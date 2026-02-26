/**
 * otpService.js
 *
 * In-memory OTP store for 2FA verification.
 * Codes are 6 digits, valid for 30 seconds, single-use.
 *
 * In production, replace the `send` step with email/SMS delivery
 * and remove the `code` field from the API response.
 */

/** @type {Map<string, { code: string, expiresAt: number }>} */
const otpStore = new Map();

const OTP_TTL_MS = 30_000; // 30 seconds

/**
 * Generate a 6-digit OTP for a given user and store it.
 * Overwrites any existing pending OTP for the same user.
 *
 * @param {string} userId
 * @returns {{ code: string, expiresIn: number }} expiresIn in seconds
 */
function generate(userId) {
    // Remove any existing OTP for this user
    otpStore.delete(userId);

    // Clean up expired entries periodically
    _cleanup();

    const code = String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
    const expiresAt = Date.now() + OTP_TTL_MS;

    otpStore.set(userId, { code, expiresAt });

    return { code, expiresIn: OTP_TTL_MS / 1000 };
}

/**
 * Verify a 6-digit OTP for a given user.
 * The OTP is consumed (deleted) on first successful verification.
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

    // Consume the OTP — single-use
    otpStore.delete(userId);
    return { valid: true };
}

/** Remove all expired entries from the store. */
function _cleanup() {
    const now = Date.now();
    for (const [userId, entry] of otpStore.entries()) {
        if (now > entry.expiresAt) otpStore.delete(userId);
    }
}

module.exports = { generate, verify };
