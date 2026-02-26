/**
 * config/env.js
 * ─────────────────────────────────────────────────────────────
 * Single source of truth for all environment variables.
 * Load this module ONCE (in app.js entry point).
 * All other modules import from here instead of reading
 * process.env or calling require('dotenv').config() themselves.
 * ─────────────────────────────────────────────────────────────
 */
require('dotenv').config();

// ── Required variables — crash fast if missing in production ──
const REQUIRED_IN_PROD = ['JWT_SECRET', 'DB_PASSWORD'];
if (process.env.NODE_ENV === 'production') {
    for (const key of REQUIRED_IN_PROD) {
        if (!process.env[key]) {
            throw new Error(`❌ Missing required environment variable: ${key}`);
        }
    }
}

const env = {
    // ── Server ──────────────────────────────────────────────
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
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

    // ── Bcrypt ───────────────────────────────────────────────
    BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10,
};

module.exports = env;
