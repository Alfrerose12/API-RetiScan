const pool = require('../config/database');

const Patient = {
    /**
     * Create a new patient record.
     * @param {{ fullName: string, age: number, phone?: string, doctorId?: string }} data
     */
    async create({ fullName, age, phone, doctorId }) {
        const result = await pool.query(
            `INSERT INTO patients (full_name, age, phone, doctor_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
            [fullName, age, phone || null, doctorId || null]
        );
        return result.rows[0];
    },

    /** Retrieve all patients ordered by most recently created. */
    async findAll() {
        const result = await pool.query(
            'SELECT * FROM patients ORDER BY created_at DESC'
        );
        return result.rows;
    },

    /** Find a single patient by UUID. */
    async findById(id) {
        const result = await pool.query(
            'SELECT * FROM patients WHERE id = $1',
            [id]
        );
        return result.rows[0] || null;
    },

    /** Find all patients linked to a specific doctor account. */
    async findByDoctorId(doctorId) {
        const result = await pool.query(
            'SELECT * FROM patients WHERE doctor_id = $1 ORDER BY created_at DESC',
            [doctorId]
        );
        return result.rows;
    },

    /**
     * Update patient fields.
     * @param {string} id
     * @param {{ fullName?: string, age?: number, phone?: string, lastVisit?: string, totalAnalyses?: number }} fields
     */
    async updateById(id, fields) {
        const map = {
            fullName: 'full_name',
            age: 'age',
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
        values.push(id);

        const result = await pool.query(
            `UPDATE patients SET ${setClauses.join(', ')}
       WHERE id = $${idx}
       RETURNING *`,
            values
        );
        return result.rows[0] || null;
    },

    /** Increment total_analyses counter and set last_visit to NOW(). */
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

    /** Permanently delete a patient and all linked analyses (CASCADE). */
    async deleteById(id) {
        const result = await pool.query(
            'DELETE FROM patients WHERE id = $1 RETURNING id',
            [id]
        );
        return result.rows[0] || null;
    },
};

module.exports = Patient;
