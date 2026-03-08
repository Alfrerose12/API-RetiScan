const patientService = require('../services/patientService');

const patientController = {
    /**
     * POST /api/patients
     * Crea un paciente y genera automáticamente su cuenta de usuario (PACIENTE).
     * Body: { fullName, lastName?, middleName?, birthDate, phone? }
     * Requiere rol MEDICO.
     */
    async createPatient(req, res, next) {
        try {
            const doctorId = req.user.id;
            const { firstName, paternalSurname, maternalSurname } = req.body;

            const { patient, patientUser, tempPassword } = await patientService.create(
                { firstName, paternalSurname, maternalSurname },
                doctorId
            );

            return res.status(201).json({
                message: 'Paciente creado exitosamente',
                patient,
                credentials: {
                    username: patientUser.username,
                    tempPassword,
                    note: 'Comparte estas credenciales con el paciente. Deberá cambiar su contraseña al primer inicio de sesión.',
                },
            });
        } catch (err) {
            next(err);
        }
    },

    /**
     * GET /api/patients
     * Lista todos los pacientes del médico autenticado (aislamiento multi-tenant).
     * Requiere rol MEDICO.
     */
    async getAllPatients(req, res, next) {
        try {
            const patients = await patientService.getAll(req.user.id);
            return res.status(200).json({ count: patients.length, patients });
        } catch (err) {
            next(err);
        }
    },

    /**
     * GET /api/patients/me
     * Vista del propio paciente: devuelve su registro de paciente.
     * Requiere rol PACIENTE.
     */
    async getMyPatientRecord(req, res, next) {
        try {
            const patient = await patientService.getMyRecord(req.user.id);
            return res.status(200).json({ patient });
        } catch (err) {
            next(err);
        }
    },

    /**
     * PATCH /api/patients/me
     * El paciente actualiza su propio perfil en el formulario del primer login:
     * birthDate, gender, email, phone.
     * Requiere rol PACIENTE.
     */
    async updateMyProfile(req, res, next) {
        try {
            const { birthDate, gender, email, phone } = req.body;

            // Validar género si viene
            const validGenders = ['MASCULINO', 'FEMENINO', 'OTRO'];
            if (gender && !validGenders.includes(gender)) {
                return res.status(400).json({
                    error: `género inválido. Valores permitidos: ${validGenders.join(', ')}`,
                });
            }

            const patient = await patientService.updateMyProfile(req.user.id, {
                birthDate,
                gender,
                email,
                phone,
            });

            return res.status(200).json({
                message: 'Perfil actualizado exitosamente',
                patient,
            });
        } catch (err) {
            next(err);
        }
    },

    /**
     * GET /api/patients/:id
     * Obtiene un paciente por ID (solo ve sus propios pacientes).
     * Requiere rol MEDICO.
     */
    async getPatientById(req, res, next) {
        try {
            const patient = await patientService.getById(req.params.id, req.user.id);
            return res.status(200).json({ patient });
        } catch (err) {
            next(err);
        }
    },

    /**
     * PUT /api/patients/:id
     * Actualiza datos del paciente (solo si pertenece al médico).
     * Requiere rol MEDICO.
     */
    async updatePatient(req, res, next) {
        try {
            const patient = await patientService.update(req.params.id, req.user.id, req.body);
            return res.status(200).json({ message: 'Paciente actualizado', patient });
        } catch (err) {
            next(err);
        }
    },

    /**
     * DELETE /api/patients/:id
     * Elimina un paciente (solo si pertenece al médico).
     * Requiere rol MEDICO.
     */
    async deletePatient(req, res, next) {
        try {
            await patientService.delete(req.params.id, req.user.id);
            return res.status(200).json({ message: 'Paciente eliminado' });
        } catch (err) {
            next(err);
        }
    },
};

module.exports = patientController;
