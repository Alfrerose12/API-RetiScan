/**
 * config/env.js
 * ─────────────────────────────────────────────────────────────
 * Única fuente de verdad para todas las variables de entorno.
 * Carga este módulo UNA VEZ (en el punto de entrada app.js).
 * Todos los demás módulos importan desde aquí en lugar de leer
 * process.env o llamar require('dotenv').config() por sí mismos.
 * ─────────────────────────────────────────────────────────────
 */
require('dotenv').config();

// ── Variables requeridas — falla rápido si faltan en producción ──
const REQUIRED_IN_PROD = ['JWT_SECRET', 'DB_PASSWORD'];
if (process.env.NODE_ENV === 'production') {
    for (const key of REQUIRED_IN_PROD) {
        if (!process.env[key]) {
            throw new Error(`❌ Missing required environment variable: ${key}`);
        }
    }
}

const env = {
    // ── Servidor ──────────────────────────────────────────────
    PORT: parseInt(process.env.PORT) || 3000,
    NODE_ENV: process.env.NODE_ENV || 'development',

    // ── PostgreSQL ───────────────────────────────────────────
    DB_USER: process.env.DB_USER || 'postgres',
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_NAME: process.env.DB_NAME || 'retiscan_prueba',
    DB_PASSWORD: process.env.DB_PASSWORD || '',
    DB_PORT: parseInt(process.env.DB_PORT) || 5432,

    // ── JWT ──────────────────────────────────────────────────
    JWT_SECRET: process.env.JWT_SECRET || 'retiscan_default_secret',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
    REFRESH_TOKEN_EXPIRES_DAYS: parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS) || 7,

    // ── Bcrypt ───────────────────────────────────────────────
    BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10,

    // ── Email (Gmail SMTP) ───────────────────────────────────
    SMTP_USER: process.env.SMTP_USER || '',
    SMTP_PASS: process.env.SMTP_PASS || '',
    SMTP_FROM: process.env.SMTP_FROM || 'RetiScan <no-reply@retiscan.com>',

    // ── App ──────────────────────────────────────────────────
    APP_URL: process.env.APP_URL || 'http://localhost:3000',
};

module.exports = env;
