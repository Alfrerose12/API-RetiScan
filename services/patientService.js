const Patient = require('../models/Patient');

const patientService = {
    /**
     * Create a patient. Only MEDICO users should call this (enforced at route level).
     */
    async create(data) {
        const { fullName, age, phone, doctorId } = data;

        if (!fullName || !age) {
            const err = new Error('fullName and age are required');
            err.statusCode = 400;
            throw err;
        }

        return Patient.create({ fullName, age, phone, doctorId });
    },

    /** List all patients. */
    async getAll() {
        return Patient.findAll();
    },

    /** Get a patient by UUID, throws 404 if not found. */
    async getById(id) {
        const patient = await Patient.findById(id);
        if (!patient) {
            const err = new Error('Patient not found');
            err.statusCode = 404;
            throw err;
        }
        return patient;
    },

    /** Get all patients linked to a specific doctor account. */
    async getByDoctorId(doctorId) {
        return Patient.findByDoctorId(doctorId);
    },

    /** Update patient data, throws 404 if not found. */
    async update(id, fields) {
        await patientService.getById(id); // validate existence
        const updated = await Patient.updateById(id, fields);
        if (!updated) {
            const err = new Error('Patient not found');
            err.statusCode = 404;
            throw err;
        }
        return updated;
    },

    /** Delete a patient. Cascades to analyses and logs in DB. */
    async delete(id) {
        await patientService.getById(id); // validate existence
        return Patient.deleteById(id);
    },
};

module.exports = patientService;
