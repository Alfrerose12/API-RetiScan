const crypto = require('crypto');
const Patient = require('../models/Patient');
const User = require('../models/User');

/**
 * Genera un username único para el paciente en formato: nombre.apellido#XXXX
 * @param {string} fullName
 * @param {string} lastName
 * @returns {string}
 */
function buildPatientUsername(fullName, lastName) {
    const normalize = (str) =>
        (str || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z]/g, '');

    const first = normalize(fullName).slice(0, 10) || 'paciente';
    const last = normalize(lastName).slice(0, 10) || 'retiscan';
    const suffix = Math.floor(1000 + Math.random() * 9000);
    return `${first}.${last}#${suffix}`;
}

const patientService = {
    /**
     * Crea un paciente y genera automáticamente una cuenta de usuario (PACIENTE).
     * Devuelve el paciente, la cuenta de usuario y la contraseña temporal.
     *
     * @param {{ fullName, lastName, middleName, birthDate, phone }} data
     * @param {string} doctorId - ID del médico autenticado
     * @returns {{ patient, patientUser, tempPassword }}
     */
    async create(data, doctorId) {
        const { firstName, paternalSurname, maternalSurname } = data;

        if (!firstName || !paternalSurname) {
            const err = new Error('firstName y paternalSurname son requeridos');
            err.statusCode = 400;
            throw err;
        }

        // 1. Generar username único (nombre.apellido#XXXX con reintentos)
        let username;
        let attempts = 0;
        do {
            username = buildPatientUsername(firstName, paternalSurname);
            attempts++;
            if (attempts > 10) {
                const err = new Error('No se pudo generar un username único, intente de nuevo');
                err.statusCode = 500;
                throw err;
            }
        } while (await User.findByUsername(username));

        // 2. Generar contraseña temporal segura
        const tempPassword = crypto.randomBytes(9).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 12);

        // 3. Crear cuenta de usuario para el paciente (users usa campo name)
        const patientUser = await User.create({
            username,
            email: null,
            name: `${firstName} ${paternalSurname}${maternalSurname ? ' ' + maternalSurname : ''}`,
            plainPassword: tempPassword,
            role: 'PACIENTE',
            mustChangePassword: true,
        });

        // 4. Crear expediente del paciente (sin birthDate ni phone — el paciente los llena al primer login)
        const patient = await Patient.create({
            firstName,
            paternalSurname,
            maternalSurname,
            birthDate: null,
            phone: null,
            doctorId,
            userId: patientUser.id,
        });

        return { patient, patientUser, tempPassword };
    },


    /**
     * Lista todos los pacientes del médico autenticado (aislamiento multi-tenant).
     * @param {string} doctorId
     */
    async getAll(doctorId) {
        return Patient.findAllByDoctor(doctorId);
    },

    /**
     * Obtiene un paciente por UUID, verificando propiedad del médico.
     * @param {string} id
     * @param {string} doctorId
     */
    async getById(id, doctorId) {
        const patient = await Patient.findByIdAndDoctor(id, doctorId);
        if (!patient) {
            const err = new Error('Paciente no encontrado');
            err.statusCode = 404;
            throw err;
        }
        return patient;
    },

    /**
     * Obtiene el registro de paciente del usuario autenticado (vista PACIENTE).
     * @param {string} userId
     */
    async getMyRecord(userId) {
        const patient = await Patient.findByUserId(userId);
        if (!patient) {
            const err = new Error('No se encontró un registro de paciente para este usuario');
            err.statusCode = 404;
            throw err;
        }
        return patient;
    },

    /**
     * Actualiza el perfil del paciente por sí mismo (primer login).
     * Solo puede modificar: birthDate, gender, email, phone.
     * @param {string} userId
     * @param {{ birthDate, gender, email, phone }} fields
     */
    async updateMyProfile(userId, fields) {
        const patient = await Patient.findByUserId(userId);
        if (!patient) {
            const err = new Error('Registro de paciente no encontrado');
            err.statusCode = 404;
            throw err;
        }

        const updated = await Patient.updateByIdAndDoctor(patient.id, patient.doctor_id, {
            birthDate: fields.birthDate,
            gender: fields.gender,
            email: fields.email,
            phone: fields.phone,
        });

        // Aseguramos que el correo también se guarde en la cuenta principal de usuario del paciente
        if (fields.email) {
            await User.updateById(userId, { email: fields.email });
        }

        if (!updated) {
            const err = new Error('No se pudo actualizar el perfil');
            err.statusCode = 500;
            throw err;
        }

        return updated;
    },

    /**
     * Actualiza los datos del paciente (con validación de propiedad).
     * @param {string} id
     * @param {string} doctorId
     * @param {object} fields
     */
    async update(id, doctorId, fields) {
        // Verificar existencia y propiedad
        await patientService.getById(id, doctorId);
        const updated = await Patient.updateByIdAndDoctor(id, doctorId, fields);
        if (!updated) {
            const err = new Error('Paciente no encontrado o sin cambios');
            err.statusCode = 404;
            throw err;
        }
        return updated;
    },

    /**
     * Elimina un paciente (solo si pertenece al médico). Cascada en análisis y logs en BD.
     * @param {string} id
     * @param {string} doctorId
     */
    async delete(id, doctorId) {
        const deleted = await Patient.deleteByIdAndDoctor(id, doctorId);
        if (!deleted) {
            const err = new Error('Paciente no encontrado');
            err.statusCode = 404;
            throw err;
        }
        return deleted;
    },
};

module.exports = patientService;
