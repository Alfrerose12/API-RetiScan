const User = require('../models/User');
const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Determina el rol automáticamente según el dominio del email.
 * @param {string} email
 * @returns {'ADMINISTRADOR'|'MEDICO'|'PACIENTE'}
 */
function resolveRoleFromEmail(email) {
    const domain = email.split('@')[1]?.toLowerCase();
    if (domain === 'yada.com') return 'ADMINISTRADOR';
    if (domain === 'retiscan.com') return 'MEDICO';
    return 'PACIENTE';
}

const userService = {
    /**
     * Register a new user. The role is assigned automatically based on the email domain:
     *   @yada.com      → ADMINISTRADOR
     *   @retiscan.com  → MEDICO
     *   anything else  → PACIENTE
     * @param {string} email
     * @param {string} password
     */
    async register(email, password) {
        const role = resolveRoleFromEmail(email);

        const existing = await User.findByEmail(email);
        if (existing) {
            const err = new Error('Email already registered');
            err.statusCode = 409;
            throw err;
        }

        const user = await User.create(email, password, role);
        return user;
    },

    /**
     * Authenticate a user and return a signed JWT.
     * @param {string} email
     * @param {string} password
     * @returns {{ token: string, user: object }}
     */
    async login(email, password) {
        const user = await User.findByEmail(email);
        if (!user) {
            const err = new Error('Invalid credentials');
            err.statusCode = 401;
            throw err;
        }

        const valid = await User.comparePassword(password, user.password_hash);
        if (!valid) {
            const err = new Error('Invalid credentials');
            err.statusCode = 401;
            throw err;
        }

        const payload = { id: user.id, email: user.email, role: user.role };
        const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });

        return {
            token,
            user: { id: user.id, email: user.email, role: user.role },
        };
    },

    /** Get full user profile (no password). */
    async getProfile(id) {
        const user = await User.findById(id);
        if (!user) {
            const err = new Error('User not found');
            err.statusCode = 404;
            throw err;
        }
        return user;
    },

    /** Update user fields.  */
    async update(id, fields) {
        const updated = await User.updateById(id, fields);
        if (!updated) {
            const err = new Error('User not found');
            err.statusCode = 404;
            throw err;
        }
        return updated;
    },

    /** Delete a user account. */
    async delete(id) {
        const deleted = await User.deleteById(id);
        if (!deleted) {
            const err = new Error('User not found');
            err.statusCode = 404;
            throw err;
        }
        return deleted;
    },
};

module.exports = userService;
