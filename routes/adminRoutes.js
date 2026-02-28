const { Router } = require('express');
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/roleMiddleware');

const router = Router();

// Todas las rutas de admin requieren JWT válido + rol ADMINISTRADOR
router.use(authMiddleware);
router.use(requireRole('ADMINISTRADOR'));

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Gestión de médicos (solo ADMINISTRADOR)
 */

/**
 * @swagger
 * /admin/doctors:
 *   post:
 *     summary: Crear un nuevo médico
 *     description: |
 *       Crea una cuenta de médico con rol **MEDICO** automáticamente.
 *       - El email se genera como `nombre.apellido@retiscan.com`
 *       - Se genera una **contraseña temporal** segura de 12 caracteres
 *       - Si el email ya existe, se añade un sufijo numérico (`nombre.apellido2@retiscan.com`)
 *
 *       El administrador debe compartir las credenciales con el médico.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateDoctorRequest'
 *     responses:
 *       201:
 *         description: Médico creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreateDoctorResponse'
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Token inválido o faltante
 *       403:
 *         description: Acceso denegado — se requiere rol ADMINISTRADOR
 */
router.post('/doctors', adminController.createDoctor);

/**
 * @swagger
 * /admin/doctors:
 *   get:
 *     summary: Listar todos los médicos registrados
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de médicos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   example: 3
 *                 doctors:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         description: Token inválido o faltante
 *       403:
 *         description: Acceso denegado — se requiere rol ADMINISTRADOR
 */
router.get('/doctors', adminController.listDoctors);

/**
 * @swagger
 * /admin/doctors/{id}:
 *   delete:
 *     summary: Eliminar un médico por ID
 *     description: Solo elimina usuarios con rol **MEDICO**. No puede usarse para eliminar otros roles.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID del médico a eliminar
 *     responses:
 *       200:
 *         description: Médico eliminado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Médico eliminado exitosamente
 *       400:
 *         description: El usuario no tiene rol MEDICO
 *       404:
 *         description: Médico no encontrado
 *       401:
 *         description: Token inválido o faltante
 *       403:
 *         description: Acceso denegado — se requiere rol ADMINISTRADOR
 */
router.delete('/doctors/:id', adminController.deleteDoctor);

module.exports = router;
