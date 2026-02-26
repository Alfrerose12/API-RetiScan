const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const env = require('../config/env');

const User = {
    /**
     * Create a new user with a hashed password.
     * @param {string} email
     * @param {string} plainPassword
     * @param {'MEDICO'|'PACIENTE'} role
     */
    async create(email, plainPassword, role) {
        const passwordHash = await bcrypt.hash(plainPassword, env.BCRYPT_SALT_ROUNDS);
        const result = await pool.query(
            `INSERT INTO users (email, password_hash, role)
       VALUES ($1, $2, $3)
       RETURNING id, email, role, created_at`,
            [email, passwordHash, role]
        );
        return result.rows[0];
    },

    /** Find a user by email (includes password_hash for auth). */
    async findByEmail(email) {
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        return result.rows[0] || null;
    },

    /** Find a user by UUID (excludes password_hash). */
    async findById(id) {
        const result = await pool.query(
            'SELECT id, email, role, created_at, updated_at FROM users WHERE id = $1',
            [id]
        );
        return result.rows[0] || null;
    },

    /** Find all users (excludes password_hash). */
    async findAll() {
        const result = await pool.query(
            'SELECT id, email, role, created_at, updated_at FROM users ORDER BY created_at DESC'
        );
        return result.rows;
    },

    /**
     * Update allowed fields for a user. Supports: email, role, password.
     * @param {string} id
     * @param {{ email?: string, role?: string, password?: string }} fields
     */
    async updateById(id, fields) {
        const setClauses = [];
        const values = [];
        let idx = 1;

        if (fields.email) {
            setClauses.push(`email = $${idx++}`);
            values.push(fields.email);
        }
        if (fields.role) {
            setClauses.push(`role = $${idx++}`);
            values.push(fields.role);
        }
        if (fields.password) {
            const hash = await bcrypt.hash(fields.password, SALT_ROUNDS);
            setClauses.push(`password_hash = $${idx++}`);
            values.push(hash);
        }

        if (!setClauses.length) return null;

        setClauses.push(`updated_at = NOW()`);
        values.push(id);

        const result = await pool.query(
            `UPDATE users SET ${setClauses.join(', ')}
       WHERE id = $${idx}
       RETURNING id, email, role, updated_at`,
            values
        );
        return result.rows[0] || null;
    },

    /** Delete a user permanently. */
    async deleteById(id) {
        const result = await pool.query(
            'DELETE FROM users WHERE id = $1 RETURNING id',
            [id]
        );
        return result.rows[0] || null;
    },

    /**
     * Compare a plain password against the stored hash.
     * @param {string} plainPassword
     * @param {string} hash
     */
    async comparePassword(plainPassword, hash) {
        return bcrypt.compare(plainPassword, hash);
    },
};

module.exports = User;
