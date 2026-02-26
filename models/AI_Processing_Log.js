const pool = require('../config/database');
const crypto = require('crypto');

const AI_Processing_Log = {
    /**
     * Create a log entry when AI processing begins.
     * task_id is a unique string PK (e.g. "task_<uuid>").
     * @param {string} analysisId
     * @returns {object} The created log row
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
     * Mark processing as complete: set end_time and final status.
     * @param {string} taskId   - The task_id (PK) of the log entry
     * @param {string} status   - Final status: 'COMPLETED' or 'FAILED'
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

    /** Retrieve all log entries for a given analysis. */
    async findByAnalysisId(analysisId) {
        const result = await pool.query(
            `SELECT * FROM ai_processing_logs
       WHERE analysis_id = $1
       ORDER BY start_time DESC`,
            [analysisId]
        );
        return result.rows;
    },

    /** Retrieve a single log entry by task_id. */
    async findById(taskId) {
        const result = await pool.query(
            'SELECT * FROM ai_processing_logs WHERE task_id = $1',
            [taskId]
        );
        return result.rows[0] || null;
    },

    /** Hard-delete a log entry. */
    async deleteById(taskId) {
        const result = await pool.query(
            'DELETE FROM ai_processing_logs WHERE task_id = $1 RETURNING task_id',
            [taskId]
        );
        return result.rows[0] || null;
    },
};

module.exports = AI_Processing_Log;
