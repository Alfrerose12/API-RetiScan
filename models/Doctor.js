/**
 * models/Doctor.js
 * CRUD para la tabla `doctors` (perfil profesional del médico).
 */
const pool = require('../config/database');

const Doctor = {
    /**
     * Crea el perfil profesional del médico vinculado a su cuenta users.
     * @param {{ userId, firstName, paternalSurname, maternalSurname, licenseNumber, specialty?, institution?, phone? }} data
     */
    async create({ userId, firstName, paternalSurname, maternalSurname, licenseNumber, specialty, institution, phone }) {
        const result = await pool.query(
            `INSERT INTO doctors (user_id, first_name, paternal_surname, maternal_surname, license_number, specialty, institution, phone)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [userId, firstName, paternalSurname, maternalSurname || null, licenseNumber, specialty || null, institution || null, phone || null]
        );
        return result.rows[0];
    },

    /** Obtiene el perfil del médico por su user_id. */
    async findByUserId(userId) {
        const result = await pool.query(
            'SELECT * FROM doctors WHERE user_id = $1',
            [userId]
        );
        return result.rows[0] || null;
    },

    /**
     * Actualiza el perfil del médico.
     * @param {string} userId
     * @param {{ firstName?, paternalSurname?, maternalSurname?, licenseNumber?, specialty?, institution?, phone? }} fields
     */
    async updateByUserId(userId, fields) {
        const map = {
            firstName: 'first_name',
            paternalSurname: 'paternal_surname',
            maternalSurname: 'maternal_surname',
            licenseNumber: 'license_number',
            specialty: 'specialty',
            institution: 'institution',
            phone: 'phone',
        };

        const setClauses = [];
        const values = [];
        let idx = 1;

        for (const [key, col] of Object.entries(map)) {
            if (fields[key] !== undefined) {
                setClauses.push(`${col} = $${idx++}`);
                values.push(fields[key]);
            }
        }

        if (!setClauses.length) return null;

        setClauses.push(`updated_at = NOW()`);
        values.push(userId);

        const result = await pool.query(
            `UPDATE doctors SET ${setClauses.join(', ')}
             WHERE user_id = $${idx}
             RETURNING *`,
            values
        );
        return result.rows[0] || null;
    },
};

module.exports = Doctor;
