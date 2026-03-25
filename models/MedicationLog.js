const pool = require('../config/database');

const MedicationLog = {
    /**
     * Registrar una toma de medicamento.
     */
    async create({ recommendationId, nextDoseAt }) {
        const result = await pool.query(
            `INSERT INTO medication_logs (recommendation_id, taken_at, next_dose_at)
             VALUES ($1, NOW(), $2)
             RETURNING *`,
            [recommendationId, nextDoseAt]
        );
        return result.rows[0];
    },

    /**
     * Historial de tomas de una recomendación/medicamento.
     */
    async findByRecommendation(recommendationId, limit = 20) {
        const result = await pool.query(
            `SELECT * FROM medication_logs
             WHERE recommendation_id = $1
             ORDER BY taken_at DESC
             LIMIT $2`,
            [recommendationId, limit]
        );
        return result.rows;
    },
};

module.exports = MedicationLog;
