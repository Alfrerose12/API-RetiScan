const { Router } = require('express');
const twoFactorController = require('../controllers/twoFactorController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = Router();

// All 2FA routes require a valid JWT
router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: 2FA
 *   description: Verificación en dos pasos (Two-Factor Authentication)
 */

/**
 * @swagger
 * /auth/2fa/send:
 *   post:
 *     summary: Generar y enviar código OTP de 6 dígitos
 *     description: |
 *       Genera un código OTP de 6 dígitos válido por **30 segundos**.
 *       En esta implementación de desarrollo, el código se retorna directamente
 *       en la respuesta para que la PWA lo muestre en el banner de simulación.
 *
 *       > ⚠️ **Producción**: el campo `code` se eliminaría y el código se enviaría
 *       > por email o SMS al usuario.
 *     tags: [2FA]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OTP generado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 2FA code generated successfully
 *                 code:
 *                   type: string
 *                   example: "483921"
 *                   description: Código de 6 dígitos (solo en desarrollo)
 *                 expiresIn:
 *                   type: integer
 *                   example: 30
 *                   description: Segundos hasta que el código expire
 *       401:
 *         description: Token inválido o faltante
 */
router.post('/2fa/send', twoFactorController.sendOtp);

/**
 * @swagger
 * /auth/2fa/verify:
 *   post:
 *     summary: Verificar el código OTP ingresado por el usuario
 *     description: |
 *       Valida el OTP de 6 dígitos. El código es de **uso único** — se consume
 *       tras una verificación exitosa. Si el código expiró o es incorrecto,
 *       retorna 400 con el motivo del error.
 *     tags: [2FA]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code:
 *                 type: string
 *                 example: "483921"
 *                 description: El código de 6 dígitos recibido
 *     responses:
 *       200:
 *         description: Verificación exitosa
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 verified:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Código inválido, expirado o faltante
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: OTP has expired. Request a new code.
 *       401:
 *         description: Token inválido o faltante
 */
router.post('/2fa/verify', twoFactorController.verifyOtp);

module.exports = router;
