const patientService = require('../services/patientService');

const patientController = {
    /** POST /api/patients */
    async createPatient(req, res, next) {
        try {
            const { fullName, age, phone } = req.body;
            const doctorId = req.user?.id;
            const patient = await patientService.create({ fullName, age, phone, doctorId });
            return res.status(201).json({ message: 'Patient created', patient });
        } catch (err) {
            next(err);
        }
    },

    /** GET /api/patients */
    async getAllPatients(req, res, next) {
        try {
            const patients = await patientService.getAll();
            return res.status(200).json({ count: patients.length, patients });
        } catch (err) {
            next(err);
        }
    },

    /** GET /api/patients/:id */
    async getPatientById(req, res, next) {
        try {
            const patient = await patientService.getById(req.params.id);
            return res.status(200).json({ patient });
        } catch (err) {
            next(err);
        }
    },

    /** PUT /api/patients/:id */
    async updatePatient(req, res, next) {
        try {
            const patient = await patientService.update(req.params.id, req.body);
            return res.status(200).json({ message: 'Patient updated', patient });
        } catch (err) {
            next(err);
        }
    },

    /** DELETE /api/patients/:id */
    async deletePatient(req, res, next) {
        try {
            await patientService.delete(req.params.id);
            return res.status(200).json({ message: 'Patient deleted' });
        } catch (err) {
            next(err);
        }
    },
};

module.exports = patientController;
