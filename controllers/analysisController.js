const analysisService = require('../services/analysisService');

const analysisController = {
    /**
     * POST /api/analyses
     * Devuelve inmediatamente un 202 Accepted con el registro PENDING.
     * El procesamiento de IA comienza asincrónicamente en segundo plano.
     * Body: { patientId, eye: 'LEFT'|'RIGHT', imageUri?, doctorNotes? }
     * Requiere rol MEDICO.
     */
    async createAnalysis(req, res, next) {
        try {
            const { patientId, eye, imageUri, doctorNotes } = req.body;
            const analysis = await analysisService.createAnalysis({
                patientId,
                doctorId: req.user.id,
                eye,
                imageUri,
                doctorNotes,
            });
            return res.status(202).json({
                message: 'Análisis en cola — el procesamiento de IA ha comenzado en segundo plano',
                analysis,
            });
        } catch (err) {
            next(err);
        }
    },

    /**
     * GET /api/analyses/patient/:patientId
     * Lista todos los análisis de un paciente (solo los del médico autenticado).
     * Requiere rol MEDICO.
     */
    async getAnalysisByPatient(req, res, next) {
        try {
            const analyses = await analysisService.getByPatientAndDoctor(
                req.params.patientId,
                req.user.id
            );
            return res.status(200).json({ count: analyses.length, analyses });
        } catch (err) {
            next(err);
        }
    },

    /**
     * GET /api/analyses/my
     * Vista del paciente: devuelve sus propios análisis.
     * Requiere rol PACIENTE.
     */
    async getMyAnalyses(req, res, next) {
        try {
            const analyses = await analysisService.getByPatientUserId(req.user.id);
            return res.status(200).json({ count: analyses.length, analyses });
        } catch (err) {
            next(err);
        }
    },

    /**
     * GET /api/analyses/:id
     * Obtiene un análisis por ID (con verificación de propiedad del médico).
     * Requiere rol MEDICO.
     */
    async getAnalysisById(req, res, next) {
        try {
            const analysis = await analysisService.getById(req.params.id, req.user.id);
            return res.status(200).json({ analysis });
        } catch (err) {
            next(err);
        }
    },

    /**
     * GET /api/analyses/:id/logs
     * Logs de auditoría del procesamiento de IA.
     * Requiere rol MEDICO.
     */
    async getAnalysisLogs(req, res, next) {
        try {
            const logs = await analysisService.getLogsForAnalysis(req.params.id);
            return res.status(200).json({ count: logs.length, logs });
        } catch (err) {
            next(err);
        }
    },

    /**
     * DELETE /api/analyses/:id
     * Elimina un análisis (solo si pertenece al médico autenticado).
     * Requiere rol MEDICO.
     */
    async deleteAnalysis(req, res, next) {
        try {
            await analysisService.delete(req.params.id, req.user.id);
            return res.status(200).json({ message: 'Análisis eliminado' });
        } catch (err) {
            next(err);
        }
    },
};

module.exports = analysisController;
