/**
 * services/verificationService.js
 * Orquesta el flujo de verificación para médicos (link) y pacientes (OTP).
 */
const User = require('../models/User');
const Patient = require('../models/Patient');
const Verification = require('../models/Verification');
const emailService = require('./emailService');

const verificationService = {
    /**
     * MÉDICO: genera un token de link y lo envía al correo del médico.
     * Se llama justo después de que el médico se registra.
     * @param {string} userId
     */
    async sendDoctorVerificationEmail(userId) {
        const user = await User.findById(userId);
        if (!user) throw Object.assign(new Error('Usuario no encontrado'), { statusCode: 404 });
        if (!user.email) throw Object.assign(new Error('El usuario no tiene email'), { statusCode: 400 });
        if (user.is_verified) throw Object.assign(new Error('La cuenta ya está verificada'), { statusCode: 409 });

        const verification = await Verification.createEmailLink(userId);
        await emailService.sendVerificationLink(user.email, verification.token, user.name);
        return { message: 'Correo de verificación enviado' };
    },

    /**
     * MÉDICO: verifica el token del link y activa la cuenta.
     * Activa también 30 días de suscripción de prueba.
     * @param {string} token - Token hexadecimal
     */
    async verifyEmailLink(token) {
        if (!token) throw Object.assign(new Error('Token requerido'), { statusCode: 400 });

        const record = await Verification.findValidEmailLink(token);
        if (!record) {
            throw Object.assign(new Error('Token inválido o expirado'), { statusCode: 400 });
        }

        // Activar cuenta + 30 días de suscripción de prueba
        const trialEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await User.updateById(record.user_id, {
            is_verified: true,
            subscription_end_date: trialEnd,
        });

        // Marcar token como usado
        await Verification.markUsed(record.id);

        return { message: 'Tu cuenta ha sido activada exitosamente. Ya puedes acceder a la infraestructura completa de RetiScan.' };
    },

    /**
     * PACIENTE: genera un OTP y lo envía al correo del paciente.
     * El paciente debe haber proporcionado su email en el perfil.
     * @param {string} userId
     * @param {string} email   - Email ingresado por el paciente en su perfil
     * @param {'OTP_EMAIL'} type
     */
    async sendPatientOtp(userId, email, type = 'OTP_EMAIL') {
        const user = await User.findById(userId);
        if (!user) throw Object.assign(new Error('Usuario no encontrado'), { statusCode: 404 });
        // Removido: (user.is_verified) throw error. Permitimos solicitar OTP a usuarios verificados para MFA y cambios de contraseña.

        const verification = await Verification.createOtp(userId, type);

        // Recuperar nombre del paciente para el correo
        let profileName = user.username;
        const patient = await Patient.findByUserId(userId);
        if (patient) {
            profileName = `${patient.first_name} ${patient.paternal_surname}${patient.maternal_surname ? ' ' + patient.maternal_surname : ''}`;
        }

        // Para SMS simulado también enviamos al correo
        await emailService.sendOtp(email, verification.token, profileName);

        const response = { message: `Código OTP enviado al correo ${email}` };
        // En desarrollo devolvemos el OTP en la respuesta para facilitar pruebas
        if (process.env.NODE_ENV === 'development') {
            response._dev_otp = verification.token;
        }
        return response;
    },

    /**
     * PACIENTE: verifica el OTP ingresado y activa la cuenta.
     * @param {string} userId
     * @param {string} otp
     * @param {'OTP_EMAIL'} type
     */
    async verifyPatientOtp(userId, otp, type = 'OTP_EMAIL') {
        if (!otp) throw Object.assign(new Error('OTP requerido'), { statusCode: 400 });

        const record = await Verification.findValidOtp(userId, otp, type);
        if (!record) {
            throw Object.assign(new Error('Código inválido o expirado'), { statusCode: 400 });
        }

        await User.updateById(userId, { is_verified: true });
        await Verification.markUsed(record.id);

        return { message: 'Cuenta verificada exitosamente' };
    },
};

module.exports = verificationService;
