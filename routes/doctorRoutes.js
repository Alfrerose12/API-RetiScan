const { Router } = require('express');
const doctorController = require('../controllers/doctorController');
const authMiddleware = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/roleMiddleware');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Doctors
 *   description: Perfil profesional del médico (cédula, especialidad, etc.)
 */

/**
 * @swagger
 * /doctors/profile:
 *   post:
 *     summary: Crear perfil profesional del médico y enviar correo de verificación
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DoctorProfileRequest'
 *     responses:
 *       201:
 *         description: Perfil creado — correo de verificación enviado
 *       400:
 *         description: licenseNumber requerido
 *       409:
 *         description: Perfil ya existe
 */
router.post('/profile',
    authMiddleware,
    requireRole('MEDICO'),
    doctorController.createProfile
);

/**
 * @swagger
 * /doctors/profile:
 *   get:
 *     summary: Obtener perfil profesional del médico autenticado
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del médico
 *       404:
 *         description: Perfil no encontrado
 */
router.get('/profile',
    authMiddleware,
    requireRole('MEDICO'),
    doctorController.getProfile
);

/**
 * @swagger
 * /doctors/profile:
 *   put:
 *     summary: Actualizar perfil profesional del médico
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil actualizado
 */
router.put('/profile',
    authMiddleware,
    requireRole('MEDICO'),
    doctorController.updateProfile
);

/**
 * @swagger
 * /doctors/resend-verification:
 *   post:
 *     summary: Reenviar correo de verificación al médico
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Correo reenviado
 *       409:
 *         description: La cuenta ya está verificada
 */
router.post('/resend-verification',
    authMiddleware,
    requireRole('MEDICO'),
    doctorController.resendVerification
);

module.exports = router;
