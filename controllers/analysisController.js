const analysisService = require('../services/analysisService');

const analysisController = {
    /**
     * POST /api/analyses
     * Immediately returns a 202 Accepted with the PENDING record.
     * The AI processing begins asynchronously in the background.
     */
    async createAnalysis(req, res, next) {
        try {
            const { patientId } = req.body;
            if (!patientId) {
                return res.status(400).json({ error: 'patientId is required' });
            }
            const analysis = await analysisService.createAnalysis(patientId);
            return res.status(202).json({
                message: 'Analysis queued — AI processing has started in the background',
                analysis,
            });
        } catch (err) {
            next(err);
        }
    },

    /** GET /api/analyses/patient/:patientId */
    async getAnalysisByPatient(req, res, next) {
        try {
            const analyses = await analysisService.getByPatientId(req.params.patientId);
            return res.status(200).json({ count: analyses.length, analyses });
        } catch (err) {
            next(err);
        }
    },

    /** GET /api/analyses/:id */
    async getAnalysisById(req, res, next) {
        try {
            const analysis = await analysisService.getById(req.params.id);
            return res.status(200).json({ analysis });
        } catch (err) {
            next(err);
        }
    },

    /** GET /api/analyses/:id/logs */
    async getAnalysisLogs(req, res, next) {
        try {
            const logs = await analysisService.getLogsForAnalysis(req.params.id);
            return res.status(200).json({ count: logs.length, logs });
        } catch (err) {
            next(err);
        }
    },

    /** DELETE /api/analyses/:id */
    async deleteAnalysis(req, res, next) {
        try {
            await analysisService.delete(req.params.id);
            return res.status(200).json({ message: 'Analysis deleted' });
        } catch (err) {
            next(err);
        }
    },
};

module.exports = analysisController;
