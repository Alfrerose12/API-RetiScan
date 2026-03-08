const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const env = require('../config/env');

const User = {
    /**
     * Crea un nuevo usuario con contraseña hasheada.
     * @param {{ username, email, name, plainPassword, role, mustChangePassword, subscriptionEndDate }} data
     */
    async create({ username, email, name, plainPassword, role, mustChangePassword = false, subscriptionEndDate = null }) {
        const passwordHash = await bcrypt.hash(plainPassword, env.BCRYPT_SALT_ROUNDS);
        const result = await pool.query(
            `INSERT INTO users (username, email, name, password_hash, role, must_change_password, subscription_end_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, username, email, name, role, must_change_password, is_verified, subscription_end_date, created_at`,
            [username, email || null, name, passwordHash, role, mustChangePassword, subscriptionEndDate]
        );
        return result.rows[0];
    },

    /** Busca un usuario por email (incluye password_hash para auth). */
    async findByEmail(email) {
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        return result.rows[0] || null;
    },

    /** Busca un usuario por username (incluye password_hash para auth). */
    async findByUsername(username) {
        const result = await pool.query(
            'SELECT * FROM users WHERE username = $1',
            [username]
        );
        return result.rows[0] || null;
    },

    /** Busca un usuario por UUID (excluye password_hash). */
    async findById(id) {
        const result = await pool.query(
            'SELECT id, username, email, name, role, must_change_password, is_verified, subscription_end_date, created_at, updated_at FROM users WHERE id = $1',
            [id]
        );
        return result.rows[0] || null;
    },

    /**
     * Actualiza campos permitidos del usuario.
     * Soporta: email, name, role, password, subscription_end_date, is_verified
     */
    async updateById(id, fields) {
        const setClauses = [];
        const values = [];
        let idx = 1;

        if (fields.email !== undefined) { setClauses.push(`email = $${idx++}`); values.push(fields.email); }
        if (fields.name) { setClauses.push(`name = $${idx++}`); values.push(fields.name); }
        if (fields.role) { setClauses.push(`role = $${idx++}`); values.push(fields.role); }
        if (fields.is_verified !== undefined) { setClauses.push(`is_verified = $${idx++}`); values.push(fields.is_verified); }
        if (fields.subscription_end_date !== undefined) { setClauses.push(`subscription_end_date = $${idx++}`); values.push(fields.subscription_end_date); }
        if (fields.password) {
            const hash = await bcrypt.hash(fields.password, env.BCRYPT_SALT_ROUNDS);
            setClauses.push(`password_hash = $${idx++}`);
            values.push(hash);
        }

        if (!setClauses.length) return null;

        setClauses.push(`updated_at = NOW()`);
        values.push(id);

        const result = await pool.query(
            `UPDATE users SET ${setClauses.join(', ')}
       WHERE id = $${idx}
       RETURNING id, username, email, name, role, must_change_password, is_verified, subscription_end_date, updated_at`,
            values
        );
        return result.rows[0] || null;
    },

    /**
     * Cambia la contraseña del usuario y borra la bandera must_change_password.
     * @param {string} id
     * @param {string} newPlainPassword
     */
    async changePassword(id, newPlainPassword) {
        const hash = await bcrypt.hash(newPlainPassword, env.BCRYPT_SALT_ROUNDS);
        const result = await pool.query(
            `UPDATE users
             SET password_hash = $1, must_change_password = FALSE, updated_at = NOW()
             WHERE id = $2
             RETURNING id, username, email, name, role, must_change_password, updated_at`,
            [hash, id]
        );
        return result.rows[0] || null;
    },

    /** Elimina un usuario permanentemente. */
    async deleteById(id) {
        const result = await pool.query(
            'DELETE FROM users WHERE id = $1 RETURNING id',
            [id]
        );
        return result.rows[0] || null;
    },

    /** Compara una contraseña en texto plano contra el hash almacenado. */
    async comparePassword(plainPassword, hash) {
        return bcrypt.compare(plainPassword, hash);
    },
};

module.exports = User;
