const pool = require('../config/database');

const Patient = {
    /**
     * Crea un nuevo registro de paciente.
     * @param {{ firstName, paternalSurname, maternalSurname, birthDate, phone, doctorId, userId? }} data
     */
    async create({ firstName, paternalSurname, maternalSurname, birthDate, phone, doctorId, userId = null }) {
        const result = await pool.query(
            `INSERT INTO patients (first_name, paternal_surname, maternal_surname, birth_date, phone, doctor_id, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
            [firstName, paternalSurname, maternalSurname || null, birthDate, phone || null, doctorId, userId]
        );
        return result.rows[0];
    },

    /**
     * Vincula una cuenta de usuario (user_id) a un registro de paciente.
     */
    async linkUser(patientId, userId) {
        const result = await pool.query(
            `UPDATE patients SET user_id = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
            [userId, patientId]
        );
        return result.rows[0] || null;
    },

    /**
     * Recupera todos los pacientes de un médico (aislamiento multi-tenant).
     */
    async findAllByDoctor(doctorId) {
        const result = await pool.query(
            'SELECT * FROM patients WHERE doctor_id = $1 ORDER BY created_at DESC',
            [doctorId]
        );
        return result.rows;
    },

    /**
     * Encuentra un paciente por UUID, verificando que pertenezca al médico.
     */
    async findByIdAndDoctor(id, doctorId) {
        const result = await pool.query(
            'SELECT * FROM patients WHERE id = $1 AND doctor_id = $2',
            [id, doctorId]
        );
        return result.rows[0] || null;
    },

    /** Encuentra un paciente por su user_id vinculado. */
    async findByUserId(userId) {
        const result = await pool.query(
            'SELECT * FROM patients WHERE user_id = $1',
            [userId]
        );
        return result.rows[0] || null;
    },

    /**
     * Actualiza los campos de un paciente (con validación de propiedad del médico).
     */
    async updateByIdAndDoctor(id, doctorId, fields) {
        const map = {
            firstName: 'first_name',
            paternalSurname: 'paternal_surname',
            maternalSurname: 'maternal_surname',
            birthDate: 'birth_date',
            phone: 'phone',
            lastVisit: 'last_visit',
            totalAnalyses: 'total_analyses',
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
        values.push(id, doctorId);

        const result = await pool.query(
            `UPDATE patients SET ${setClauses.join(', ')}
       WHERE id = $${idx} AND doctor_id = $${idx + 1}
       RETURNING *`,
            values
        );
        return result.rows[0] || null;
    },

    /** Incrementa el contador total_analyses y actualiza last_visit. */
    async incrementAnalyses(id) {
        const result = await pool.query(
            `UPDATE patients
       SET total_analyses = total_analyses + 1,
           last_visit     = NOW(),
           updated_at     = NOW()
       WHERE id = $1
       RETURNING *`,
            [id]
        );
        return result.rows[0] || null;
    },

    /** Elimina permanentemente un paciente (con verificación de propiedad del médico). */
    async deleteByIdAndDoctor(id, doctorId) {
        const result = await pool.query(
            'DELETE FROM patients WHERE id = $1 AND doctor_id = $2 RETURNING id',
            [id, doctorId]
        );
        return result.rows[0] || null;
    },
};

module.exports = Patient;
