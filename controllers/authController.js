const authService = require('../services/authService');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Verification = require('../models/Verification');
const emailService = require('../services/emailService');
const pool = require('../config/database');
const bcrypt = require('bcryptjs');

const authController = {
    /**
     * POST /api/auth/login
     * Login unificado: acepta email (médicos) o username (pacientes).
     */
    async login(req, res, next) {
        try {
            const { identifier, password } = req.body;
            if (!identifier || !password) {
                return res.status(400).json({ error: 'Se requieren "identifier" y "password"' });
            }
            const result = await authService.login(identifier, password);
            return res.status(200).json({ message: 'Inicio de sesión exitoso', ...result });
        } catch (err) {
            next(err);
        }
    },

    /**
     * POST /api/auth/logout
     * Invalida el token JWT actual (Cerrar sesión)
     */
    async logout(req, res, next) {
        try {
            const token = req.token;
            if (token && req.user && req.user.exp) {
                const expDate = new Date(req.user.exp * 1000);
                await pool.query(
                    'INSERT INTO blacklisted_tokens (token, expires_at) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                    [token, expDate]
                );
            }
            return res.status(200).json({ message: 'Sesión cerrada exitosamente' });
        } catch (err) {
            next(err);
        }
    },

    /**
     * POST /api/auth/register
     * Registro unificado del médico desde la landing page:
     *   1. Crea cuenta en users (rol MEDICO)
     *   2. Crea perfil en doctors (cédula, especialidad, etc.)
     *   3. Envía correo de verificación automáticamente
     */
    async register(req, res, next) {
        try {
            const {
                firstName,
                paternalSurname,
                maternalSurname,
                email,
                password,
                licenseNumber,
                specialty,
                institution,
                phone,
            } = req.body;

            // Validaciones básicas
            if (!firstName || !paternalSurname || !email || !password || !licenseNumber) {
                return res.status(400).json({
                    error: 'Los campos firstName, paternalSurname, email, password y licenseNumber son requeridos',
                });
            }

            if (password.length < 6) {
                return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
            }

            // Verificar que el email no esté en uso
            const existing = await User.findByEmail(email);
            if (existing) {
                return res.status(409).json({ error: 'El correo electrónico ya está registrado' });
            }

            // Generar username a partir del email
            let baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9._]/g, '');
            if (!baseUsername) baseUsername = 'medico';
            let username = baseUsername;
            let attempt = 1;
            while (await User.findByUsername(username)) {
                attempt++;
                username = `${baseUsername}${attempt}`;
            }

            // 1. Crear cuenta de usuario (Sin campo name)
            const user = await User.create({
                username,
                email,
                plainPassword: password,
                role: 'MEDICO',
                mustChangePassword: false,
                subscriptionEndDate: null,
            });

            // 2. Crear perfil de médico (Con nombres tripartitos)
            const doctorProfile = await Doctor.create({
                userId: user.id,
                firstName,
                paternalSurname,
                maternalSurname,
                licenseNumber,
                specialty,
                institution,
                phone,
            });

            // 3. Enviar correo de verificación
            const verification = await Verification.createEmailLink(user.id);
            const fullName = `${firstName} ${paternalSurname}${maternalSurname ? ' ' + maternalSurname : ''}`;
            await emailService.sendVerificationLink(user.email, verification.token, fullName);

            return res.status(201).json({
                message: 'Registro exitoso. Por favor revisa tu correo para verificar tu cuenta y activar tu suscripción de prueba.',
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    firstName: doctorProfile.first_name,
                    paternalSurname: doctorProfile.paternal_surname,
                    maternalSurname: doctorProfile.maternal_surname,
                    role: user.role,
                    is_verified: user.is_verified,
                },
                doctor: doctorProfile,
            });
        } catch (err) {
            next(err);
        }
    },

    /**
     * POST /api/auth/forgot-password
     * Envía un OTP de recuperación al correo (común para pacientes y médicos).
     */
    async forgotPassword(req, res, next) {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ error: 'El correo electrónico es requerido' });
            }

            const user = await User.findByEmail(email);
            if (user) {
                // Recuperar nombre para el correo
                let profileName = user.username;
                if (user.role === 'MEDICO') {
                    const doc = await Doctor.findByUserId(user.id);
                    if (doc) profileName = `${doc.first_name} ${doc.paternal_surname}${doc.maternal_surname ? ' ' + doc.maternal_surname : ''}`;
                } else {
                    const pat = await pool.query('SELECT first_name, paternal_surname FROM patients WHERE user_id = $1', [user.id]);
                    if (pat.rows[0]) profileName = `${pat.rows[0].first_name} ${pat.rows[0].paternal_surname}`;
                }

                const otpRecord = await Verification.createOtp(user.id, 'OTP_EMAIL');
                await emailService.sendPasswordResetOtp(user.email, otpRecord.token, profileName);
            }

            return res.status(200).json({ message: 'Si el correo existe en nuestro sistema, te enviaremos un código de recuperación en unos momentos.' });
        } catch (err) {
            next(err);
        }
    },

    /**
     * POST /api/auth/reset-password
     * Verifica el OTP y cambia la contraseña del usuario.
     */
    async resetPassword(req, res, next) {
        try {
            const { email, otp, newPassword } = req.body;

            if (!email || !otp || !newPassword) {
                return res.status(400).json({ error: 'Faltan parámetros (email, otp, newPassword)' });
            }
            if (newPassword.length < 6) {
                return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
            }

            const user = await User.findByEmail(email);
            if (!user) {
                return res.status(404).json({ error: 'El correo electrónico no está registrado' });
            }

            // Validar el OTP
            const validOtp = await Verification.findValidOtp(user.id, otp, 'OTP_EMAIL');
            if (!validOtp) {
                return res.status(400).json({ error: 'El código OTP es inválido o ya ha expirado' });
            }

            // Encriptar nueva contraseña
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(newPassword, salt);

            // Actualizar DB
            await pool.query(
                'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
                [hash, user.id]
            );

            // Marcar OTP como quemado
            await Verification.markUsed(validOtp.id);

            return res.status(200).json({ message: 'Contraseña restablecida exitosamente. Ya puedes iniciar sesión de forma segura.' });
        } catch (err) {
            next(err);
        }
    },
};

module.exports = authController;
