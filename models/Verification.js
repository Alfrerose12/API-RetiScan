/**
 * models/Verification.js
 * CRUD para la tabla `verifications` (tokens OTP y links de email).
 */
const pool = require('../config/database');
const crypto = require('crypto');

const Verification = {
    /**
     * Crea un token de verificación por link de email (UUID hex, 64 chars).
     * Expira en 24 horas.
     * @param {string} userId
     * @returns {{ id, token, expires_at }}
     */
    async createEmailLink(userId) {
        const token = crypto.randomBytes(32).toString('hex'); // 64 chars hex
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // +24h

        // Eliminar tokens anteriores del mismo tipo para este usuario
        await pool.query(
            "DELETE FROM verifications WHERE user_id = $1 AND type = 'EMAIL_LINK'",
            [userId]
        );

        const result = await pool.query(
            `INSERT INTO verifications (user_id, type, token, expires_at)
             VALUES ($1, 'EMAIL_LINK', $2, $3)
             RETURNING *`,
            [userId, token, expiresAt]
        );
        return result.rows[0];
    },

    /**
     * Crea un OTP de 6 dígitos para verificación por correo o SMS simulado.
     * Expira en 15 minutos.
     * @param {string} userId
     * @param {'OTP_EMAIL'|'OTP_SMS'} type
     * @returns {{ id, token, expires_at }}
     */
    async createOtp(userId, type = 'OTP_EMAIL') {
        const otp = String(Math.floor(100000 + Math.random() * 900000)); // 6 dígitos
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // +15min

        // Eliminar OTPs anteriores del mismo tipo para este usuario
        await pool.query(
            'DELETE FROM verifications WHERE user_id = $1 AND type = $2',
            [userId, type]
        );

        const result = await pool.query(
            `INSERT INTO verifications (user_id, type, token, expires_at)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [userId, type, otp, expiresAt]
        );
        return result.rows[0];
    },

    /**
     * Busca un token de EMAIL_LINK válido (sin usar y sin expirar).
     * @param {string} token
     */
    async findValidEmailLink(token) {
        const result = await pool.query(
            `SELECT * FROM verifications
             WHERE token = $1
               AND type  = 'EMAIL_LINK'
               AND used  = FALSE
               AND expires_at > NOW()`,
            [token]
        );
        return result.rows[0] || null;
    },

    /**
     * Busca un OTP válido (sin usar y sin expirar) para un usuario.
     * @param {string} userId
     * @param {string} otp
     * @param {'OTP_EMAIL'|'OTP_SMS'} type
     */
    async findValidOtp(userId, otp, type = 'OTP_EMAIL') {
        const result = await pool.query(
            `SELECT * FROM verifications
             WHERE user_id = $1
               AND token   = $2
               AND type    = $3
               AND used    = FALSE
               AND expires_at > NOW()`,
            [userId, otp, type]
        );
        return result.rows[0] || null;
    },

    /** Marca un token como usado para que no pueda reutilizarse. */
    async markUsed(id) {
        await pool.query(
            'UPDATE verifications SET used = TRUE WHERE id = $1',
            [id]
        );
    },
};

module.exports = Verification;
