const pool = require('../config/database');

const Recommendation = {
    /**
     * Crear recomendación o medicamento para un paciente.
     * @param {{ patientId, type, title, description, dosage, frequencyHours, createdBy }} data
     */
    async create({ patientId, type, title, description, dosage, frequencyHours, createdBy }) {
        const nextDose = type === 'MEDICATION' && frequencyHours
            ? new Date(Date.now() + frequencyHours * 3600000).toISOString()
            : null;

        const result = await pool.query(
            `INSERT INTO recommendations
             (patient_id, type, title, description, dosage, frequency_hours, next_dose_at, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [patientId, type, title, description || null, dosage || null,
                frequencyHours || null, nextDose, createdBy]
        );
        return result.rows[0];
    },

    /**
     * Obtener todas las recomendaciones activas de un paciente.
     */
    async findByPatient(patientId) {
        const result = await pool.query(
            `SELECT * FROM recommendations
             WHERE patient_id = $1 AND is_active = true
             ORDER BY type ASC, created_at DESC`,
            [patientId]
        );
        return result.rows;
    },

    /**
     * Obtener una recomendación por ID.
     */
    async findById(id) {
        const result = await pool.query(
            'SELECT * FROM recommendations WHERE id = $1',
            [id]
        );
        return result.rows[0] || null;
    },

    /**
     * Actualizar next_dose_at tras confirmar toma.
     */
    async updateNextDose(id, nextDoseAt) {
        const result = await pool.query(
            `UPDATE recommendations SET next_dose_at = $1, updated_at = NOW()
             WHERE id = $2 RETURNING *`,
            [nextDoseAt, id]
        );
        return result.rows[0] || null;
    },

    /**
     * Desactivar (soft delete) una recomendación.
     */
    async deactivate(id) {
        const result = await pool.query(
            `UPDATE recommendations SET is_active = false, updated_at = NOW()
             WHERE id = $1 RETURNING id`,
            [id]
        );
        return result.rows[0] || null;
    },
};

module.exports = Recommendation;
