const Recommendation = require('../models/Recommendation');
const MedicationLog = require('../models/MedicationLog');
const Patient = require('../models/Patient');

const recommendationController = {
    /**
     * POST /recommendations — Crear recomendación/medicamento (MEDICO)
     */
    async createRecommendation(req, res, next) {
        try {
            const { patientId, type, title, description, dosage, frequencyHours } = req.body;
            if (!patientId || !type || !title) {
                return res.status(400).json({ error: 'patientId, type y title son requeridos' });
            }
            if (!['RECOMMENDATION', 'MEDICATION'].includes(type)) {
                return res.status(400).json({ error: 'type debe ser RECOMMENDATION o MEDICATION' });
            }

            // Verificar que el paciente pertenece al médico
            const patient = await Patient.findByIdAndDoctor(patientId, req.user.doctorId || req.user.id);
            if (!patient) {
                return res.status(404).json({ error: 'Paciente no encontrado o no pertenece a este médico' });
            }

            const rec = await Recommendation.create({
                patientId,
                type,
                title,
                description,
                dosage,
                frequencyHours: type === 'MEDICATION' ? frequencyHours : null,
                createdBy: req.user.id,
            });

            res.status(201).json(rec);
        } catch (err) {
            next(err);
        }
    },

    /**
     * GET /recommendations/my — Mis recomendaciones (PACIENTE)
     */
    async getMyRecommendations(req, res, next) {
        try {
            const patient = await Patient.findByUserId(req.user.id);
            if (!patient) {
                return res.status(404).json({ error: 'Registro de paciente no encontrado' });
            }
            const recs = await Recommendation.findByPatient(patient.id);
            res.json(recs);
        } catch (err) {
            next(err);
        }
    },

    /**
     * GET /recommendations/patient/:patientId — Recomendaciones de un paciente (MEDICO)
     */
    async getPatientRecommendations(req, res, next) {
        try {
            const { patientId } = req.params;
            const patient = await Patient.findByIdAndDoctor(patientId, req.user.doctorId || req.user.id);
            if (!patient) {
                return res.status(404).json({ error: 'Paciente no encontrado' });
            }
            const recs = await Recommendation.findByPatient(patientId);
            res.json(recs);
        } catch (err) {
            next(err);
        }
    },

    /**
     * POST /recommendations/:id/confirm — Confirmar toma de medicamento (PACIENTE)
     */
    async confirmMedicationTaken(req, res, next) {
        try {
            const { id } = req.params;
            const rec = await Recommendation.findById(id);
            if (!rec) {
                return res.status(404).json({ error: 'Recomendación no encontrada' });
            }
            if (rec.type !== 'MEDICATION') {
                return res.status(400).json({ error: 'Solo se puede confirmar toma de medicamentos' });
            }

            // Verificar que pertenece al paciente autenticado
            const patient = await Patient.findByUserId(req.user.id);
            if (!patient || patient.id !== rec.patient_id) {
                return res.status(403).json({ error: 'No autorizado' });
            }

            // Calcular próxima dosis
            const nextDoseAt = rec.frequency_hours
                ? new Date(Date.now() + rec.frequency_hours * 3600000).toISOString()
                : null;

            // Registrar en el log
            const log = await MedicationLog.create({
                recommendationId: id,
                nextDoseAt,
            });

            // Actualizar next_dose_at en la recomendación
            await Recommendation.updateNextDose(id, nextDoseAt);

            res.json({
                message: 'Toma registrada correctamente',
                log,
                nextDoseAt,
            });
        } catch (err) {
            next(err);
        }
    },

    /**
     * GET /recommendations/:id/logs — Historial de tomas (PACIENTE/MEDICO)
     */
    async getMedicationLogs(req, res, next) {
        try {
            const { id } = req.params;
            const logs = await MedicationLog.findByRecommendation(id);
            res.json(logs);
        } catch (err) {
            next(err);
        }
    },

    /**
     * DELETE /recommendations/:id — Desactivar recomendación (MEDICO)
     */
    async deleteRecommendation(req, res, next) {
        try {
            const { id } = req.params;
            const result = await Recommendation.deactivate(id);
            if (!result) {
                return res.status(404).json({ error: 'Recomendación no encontrada' });
            }
            res.json({ message: 'Recomendación desactivada' });
        } catch (err) {
            next(err);
        }
    },
};

module.exports = recommendationController;
