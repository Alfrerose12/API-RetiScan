const pool = require('../config/database');

const Analysis = {
    /**
     * Create a new analysis in PENDING status.
     * image_uri is auto-generated as a placeholder; ai_result starts as NULL.
     * @param {string} patientId
     * @param {string} [imageUri]  - Optional URI of the uploaded image
     */
    async create(patientId, imageUri) {
        // Generate a placeholder URI if no image is provided yet
        const uri = imageUri || `retiscan://pending/${require('crypto').randomUUID()}`;
        const result = await pool.query(
            `INSERT INTO analyses (patient_id, image_uri, status, ai_result)
       VALUES ($1, $2, 'PENDING', NULL)
       RETURNING *`,
            [patientId, uri]
        );
        return result.rows[0];
    },

    /** Retrieve all analyses ordered by newest first. */
    async findAll() {
        const result = await pool.query(
            'SELECT * FROM analyses ORDER BY created_at DESC'
        );
        return result.rows;
    },

    /** Find a single analysis by UUID. */
    async findById(id) {
        const result = await pool.query(
            'SELECT * FROM analyses WHERE id = $1',
            [id]
        );
        return result.rows[0] || null;
    },

    /** Find all analyses for a given patient. */
    async findByPatientId(patientId) {
        const result = await pool.query(
            'SELECT * FROM analyses WHERE patient_id = $1 ORDER BY created_at DESC',
            [patientId]
        );
        return result.rows;
    },

    /**
     * Update the status and optionally the ai_result of an analysis.
     * @param {string} id
     * @param {'PENDING'|'PROCESSING'|'COMPLETED'|'FAILED'} status
     * @param {object|null} aiResult  - JSONB payload from the AI model
     */
    async updateStatus(id, status, aiResult = null) {
        const result = await pool.query(
            `UPDATE analyses
       SET status     = $1,
           ai_result  = $2,
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
            [status, aiResult ? JSON.stringify(aiResult) : null, id]
        );
        return result.rows[0] || null;
    },

    /** Permanently delete an analysis (also cascades its logs). */
    async deleteById(id) {
        const result = await pool.query(
            'DELETE FROM analyses WHERE id = $1 RETURNING id',
            [id]
        );
        return result.rows[0] || null;
    },
};

module.exports = Analysis;
