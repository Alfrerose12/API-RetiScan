const Doctor = require('../models/Doctor');
const verificationService = require('../services/verificationService');
const userService = require('../services/userService');

const doctorController = {
    /**
     * POST /api/doctors/profile
     * Crea el perfil profesional del médico (cédula, especialidad, etc.).
     * Se llama DESPUÉS del registro. Envía el correo de verificación.
     * Requiere rol MEDICO y JWT válido.
     */
    async createProfile(req, res, next) {
        try {
            const userId = req.user.id;
            const { licenseNumber, specialty, institution, phone } = req.body;

            if (!licenseNumber) {
                return res.status(400).json({ error: 'licenseNumber (cédula) es requerido' });
            }

            // Verificar que no exista ya un perfil
            const existing = await Doctor.findByUserId(userId);
            if (existing) {
                return res.status(409).json({ error: 'El perfil del médico ya existe' });
            }

            const profile = await Doctor.create({ userId, licenseNumber, specialty, institution, phone });

            // Enviar correo de verificación
            await verificationService.sendDoctorVerificationEmail(userId);

            return res.status(201).json({
                message: 'Perfil creado. Revisa tu correo para verificar tu cuenta.',
                profile,
            });
        } catch (err) {
            next(err);
        }
    },

    /**
     * GET /api/doctors/profile
     * Obtiene el perfil profesional del médico autenticado.
     */
    async getProfile(req, res, next) {
        try {
            const profile = await Doctor.findByUserId(req.user.id);
            if (!profile) {
                return res.status(404).json({ error: 'Perfil de médico no encontrado. Por favor complétalo.' });
            }
            return res.status(200).json({ profile });
        } catch (err) {
            next(err);
        }
    },

    /**
     * PUT /api/doctors/profile
     * Actualiza el perfil profesional del médico autenticado.
     */
    async updateProfile(req, res, next) {
        try {
            const updated = await Doctor.updateByUserId(req.user.id, req.body);
            if (!updated) {
                return res.status(404).json({ error: 'Perfil no encontrado' });
            }
            return res.status(200).json({ message: 'Perfil actualizado', profile: updated });
        } catch (err) {
            next(err);
        }
    },

    /**
     * POST /api/doctors/resend-verification
     * Reenvía el correo de verificación si el médico no lo recibió.
     */
    async resendVerification(req, res, next) {
        try {
            const result = await verificationService.sendDoctorVerificationEmail(req.user.id);
            return res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    },
};

module.exports = doctorController;
