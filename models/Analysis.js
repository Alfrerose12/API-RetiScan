const pool = require('../config/database');

const Analysis = {
    /**
     * Crea un nuevo análisis en estado PENDING.
     * @param {string} patientId
     * @param {string} doctorId   - Para aislamiento multi-tenant
     * @param {string} eye        - 'LEFT' o 'RIGHT'
     * @param {string} [imageUri]
     * @param {string} [doctorNotes]
     */
    async create(patientId, doctorId, eye, imageUri, doctorNotes = null) {
        const uri = imageUri || `retiscan://pending/${require('crypto').randomUUID()}`;
        const result = await pool.query(
            `INSERT INTO analyses (patient_id, doctor_id, eye, image_uri, doctor_notes, status, ai_result)
       VALUES ($1, $2, $3, $4, $5, 'PENDING', NULL)
       RETURNING *`,
            [patientId, doctorId, eye, uri, doctorNotes]
        );
        return result.rows[0];
    },

    /**
     * Recupera todos los análisis de un médico (aislamiento).
     * @param {string} doctorId
     */
    async findAllByDoctor(doctorId) {
        const result = await pool.query(
            'SELECT * FROM analyses WHERE doctor_id = $1 ORDER BY created_at DESC',
            [doctorId]
        );
        return result.rows;
    },

    /**
     * Encuentra todos los análisis de un paciente, verificando propiedad del médico.
     * @param {string} patientId
     * @param {string} doctorId
     */
    async findByPatientAndDoctor(patientId, doctorId) {
        const result = await pool.query(
            'SELECT * FROM analyses WHERE patient_id = $1 AND doctor_id = $2 ORDER BY created_at DESC',
            [patientId, doctorId]
        );
        return result.rows;
    },

    /**
     * Encuentra un análisis por UUID verificando propiedad del médico.
     * @param {string} id
     * @param {string} doctorId
     */
    async findByIdAndDoctor(id, doctorId) {
        const result = await pool.query(
            'SELECT * FROM analyses WHERE id = $1 AND doctor_id = $2',
            [id, doctorId]
        );
        return result.rows[0] || null;
    },

    /**
     * Variante para pacientes: encuentra análisis del paciente sin restricción de doctor.
     * @param {string} patientId
     */
    async findByPatientId(patientId) {
        const result = await pool.query(
            'SELECT * FROM analyses WHERE patient_id = $1 ORDER BY created_at DESC',
            [patientId]
        );
        return result.rows;
    },

    /** Encuentra un análisis por UUID (uso interno del worker de IA). */
    async findById(id) {
        const result = await pool.query(
            'SELECT * FROM analyses WHERE id = $1',
            [id]
        );
        return result.rows[0] || null;
    },

    /**
     * Actualiza el estado y opcionalmente el ai_result de un análisis.
     * @param {string} id
     * @param {'PENDING'|'PROCESSING'|'COMPLETED'|'FAILED'} status
     * @param {object|null} aiResult - Payload JSONB del modelo de IA
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

    /**
     * Elimina permanentemente un análisis (también en cascada sus registros).
     * Solo si pertenece al médico.
     */
    async deleteByIdAndDoctor(id, doctorId) {
        const result = await pool.query(
            'DELETE FROM analyses WHERE id = $1 AND doctor_id = $2 RETURNING id',
            [id, doctorId]
        );
        return result.rows[0] || null;
    },
};

module.exports = Analysis;
