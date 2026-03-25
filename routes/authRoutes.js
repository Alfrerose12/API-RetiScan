const { Router } = require('express');
const authController = require('../controllers/authController');
const verificationController = require('../controllers/verificationController');
const authMiddleware = require('../middlewares/authMiddleware');
const { loginLimiter, otpLimiter, resetPassLimiter } = require('../middlewares/rateLimitMiddleware');

const { validateMedicalRegistration } = require('../middlewares/validationMiddleware');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Autenticación y verificación de cuentas
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Registro del médico desde la landing page
 *     description: |
 *       Endpoint único que crea la cuenta, el perfil del médico y envía el correo de
 *       verificación automáticamente. El médico **no puede iniciar sesión** hasta verificar
 *       su correo. Al verificar se activan **30 días de suscripción gratuita**.
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DoctorRegisterRequest'
 *     responses:
 *       201:
 *         description: Registro exitoso — correo de verificación enviado
 *       400:
 *         description: Campos requeridos faltantes o contraseña muy corta
 *       409:
 *         description: El correo electrónico ya está registrado
 */
router.post('/register', loginLimiter, validateMedicalRegistration, authController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Iniciar sesión (médico por email, paciente por username)
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login exitoso — incluye token JWT
 *       401:
 *         description: Credenciales inválidas
 *       403:
 *         description: Cuenta no verificada — revisa tu correo
 */
router.post('/login', loginLimiter, authController.login);

/**
 * @swagger
 * /auth/verify-login-otp:
 *   post:
 *     summary: Verificar el OTP del login (Paso 2 de MFA)
 *     tags: [Auth]
 */
router.post('/verify-login-otp', otpLimiter, authController.verifyLoginOtp);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Renovar Access Token usando Refresh Token en Cookie
 *     tags: [Auth]
 *     security: []
 *     responses:
 *       200:
 *         description: Refresh token válido, retorna nuevo Access Token
 *       401:
 *         description: TOKEN_MISSING o TOKEN_INVALID
 */
router.post('/refresh', loginLimiter, authController.refresh);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Cerrar sesión (invalida el token JWT activo)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sesión cerrada correctamente
 */
router.post('/logout', authMiddleware, authController.logout);

// ── Verificación de email (médico) — SIN JWT ──────────────────────────────
/**
 * @swagger
 * /auth/verify-email:
 *   get:
 *     summary: Verificar cuenta del médico mediante el link enviado al correo
 *     description: El médico hace clic en el link recibido. Activa la cuenta y 30 días de trial.
 *     tags: [Auth]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Cuenta verificada — suscripción de prueba activada
 *       400:
 *         description: Token inválido o expirado
 */
router.get('/verify-email', verificationController.verifyEmail);

// ── OTP para pacientes — Con JWT ─────────────────────────────────────────

/**
 * @swagger
 * /auth/send-otp:
 *   post:
 *     summary: Solicitar código OTP para verificación de paciente
 *     description: |
 *       El paciente proporciona su correo/teléfono y elige el tipo de verificación.
 *       El OTP llega al correo en ambos casos (SMS simulado en desarrollo).
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *               type:
 *                 type: string
 *                 enum: [OTP_EMAIL, OTP_SMS]
 *                 default: OTP_EMAIL
 *     responses:
 *       200:
 *         description: OTP enviado al correo
 *       409:
 *         description: Cuenta ya verificada
 */
router.post('/send-otp', otpLimiter, authMiddleware, verificationController.sendOtp);

/**
 * @swagger
 * /auth/verify-otp:
 *   post:
 *     summary: Verificar código OTP del paciente
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [otp]
 *             properties:
 *               otp: { type: string, example: "483921" }
 *               type:
 *                 type: string
 *                 enum: [OTP_EMAIL, OTP_SMS]
 *                 default: OTP_EMAIL
 *     responses:
 *       200:
 *         description: Cuenta verificada exitosamente
 *       400:
 *         description: Código inválido o expirado
 */
router.post('/verify-otp', otpLimiter, authMiddleware, verificationController.verifyOtp);
/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Solicita un código OTP para recuperar la contraseña
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200:
 *         description: Se envió el correo (si existe la cuenta)
 */
router.post('/forgot-password', resetPassLimiter, authController.forgotPassword);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Valida el OTP y establece una nueva contraseña
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp, newPassword]
 *             properties:
 *               email: { type: string, format: email }
 *               otp: { type: string }
 *               newPassword: { type: string, minLength: 6 }
 *     responses:
 *       200:
 *         description: Contraseña modificada correctamente
 *       400:
 *         description: OTP inválido o expirado
 */
router.post('/reset-password', resetPassLimiter, authController.resetPassword);

module.exports = router;
