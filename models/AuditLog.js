const pool = require('../config/database');

const AuditLog = {
    /**
     * Crea un nuevo registro de auditoría.
     * @param {string} userId - ID del usuario que realizó la acción
     * @param {string} action - Acción realizada (ej. 'CREATE', 'UPDATE', 'SOFT_DELETE')
     * @param {string} entity - Entidad afectada (ej. 'PATIENT')
     * @param {string} entityId - ID del registro afectado
     * @param {object} details - Detalles adicionales (en JSON)
     */
    async log(userId, action, entity, entityId, details = {}) {
        try {
            const result = await pool.query(
                `INSERT INTO audit_logs (user_id, action, entity, entity_id, details)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING *`,
                [userId, action, entity, entityId, details]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error al guardar el log de auditoría:', error);
            // No lanzamos el error para no bloquear el flujo principal
            return null;
        }
    }
};

module.exports = AuditLog;
