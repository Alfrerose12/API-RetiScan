const pool = require('../config/database');
const crypto = require('crypto');

const AI_Processing_Log = {
    /**
     * Crea una entrada de registro cuando comienza el procesamiento de IA.
     * task_id es una cadena única PK (ej. "task_<uuid>").
     * @param {string} analysisId
     * @returns {object} La fila de registro creada
     */
    async create(analysisId) {
        const taskId = `task_${crypto.randomUUID()}`;
        const result = await pool.query(
            `INSERT INTO ai_processing_logs (task_id, analysis_id, start_time, status)
       VALUES ($1, $2, NOW(), 'PROCESSING')
       RETURNING *`,
            [taskId, analysisId]
        );
        return result.rows[0];
    },

    /**
     * Marca el procesamiento como completo: establece end_time y el estado final.
     * @param {string} taskId   - El task_id (PK) de la entrada de registro
     * @param {string} status   - Estado final: 'COMPLETED' o 'FAILED'
     */
    async complete(taskId, status = 'COMPLETED') {
        const result = await pool.query(
            `UPDATE ai_processing_logs
       SET end_time = NOW(),
           status   = $1
       WHERE task_id = $2
       RETURNING *`,
            [status, taskId]
        );
        return result.rows[0] || null;
    },

    /** Recupera todas las entradas de registro para un análisis dado. */
    async findByAnalysisId(analysisId) {
        const result = await pool.query(
            `SELECT * FROM ai_processing_logs
       WHERE analysis_id = $1
       ORDER BY start_time DESC`,
            [analysisId]
        );
        return result.rows;
    },

    /** Recupera una sola entrada de registro por task_id. */
    async findById(taskId) {
        const result = await pool.query(
            'SELECT * FROM ai_processing_logs WHERE task_id = $1',
            [taskId]
        );
        return result.rows[0] || null;
    },

    /** Elimina permanentemente una entrada de registro. */
    async deleteById(taskId) {
        const result = await pool.query(
            'DELETE FROM ai_processing_logs WHERE task_id = $1 RETURNING task_id',
            [taskId]
        );
        return result.rows[0] || null;
    },
};

module.exports = AI_Processing_Log;
