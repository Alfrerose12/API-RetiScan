const { Router } = require('express');
const patientController = require('../controllers/patientController');
const authMiddleware = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/roleMiddleware');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Patients
 *   description: Gestión de pacientes (solo MEDICO puede crear, actualizar o eliminar)
 */

/**
 * @swagger
 * /patients:
 *   post:
 *     summary: Registrar un nuevo paciente
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PatientRequest'
 *     responses:
 *       201:
 *         description: Paciente creado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 patient: { $ref: '#/components/schemas/Patient' }
 *       400:
 *         description: fullName y age son requeridos
 *       401:
 *         description: Token inválido o faltante
 *       403:
 *         description: Acceso denegado — se requiere rol MEDICO
 */
router.post('/',
    authMiddleware,
    requireRole('MEDICO', 'ADMINISTRADOR'),
    patientController.createPatient
);

/**
 * @swagger
 * /patients:
 *   get:
 *     summary: Listar todos los pacientes
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de pacientes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                 patients:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Patient'
 *       401:
 *         description: Token inválido o faltante
 */
router.get('/',
    authMiddleware,
    requireRole('MEDICO', 'PACIENTE', 'ADMINISTRADOR'),
    patientController.getAllPatients
);

/**
 * @swagger
 * /patients/{id}:
 *   get:
 *     summary: Obtener un paciente por ID
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Datos del paciente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 patient: { $ref: '#/components/schemas/Patient' }
 *       401:
 *         description: Token inválido o faltante
 *       404:
 *         description: Paciente no encontrado
 */
router.get('/:id',
    authMiddleware,
    requireRole('MEDICO', 'PACIENTE', 'ADMINISTRADOR'),
    patientController.getPatientById
);

/**
 * @swagger
 * /patients/{id}:
 *   put:
 *     summary: Actualizar datos de un paciente
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:       { type: string }
 *               age:            { type: integer }
 *               phone:          { type: string }
 *               lastVisit:      { type: string, format: date-time }
 *               totalAnalyses:  { type: integer }
 *     responses:
 *       200:
 *         description: Paciente actualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 patient: { $ref: '#/components/schemas/Patient' }
 *       401:
 *         description: Token inválido o faltante
 *       403:
 *         description: Acceso denegado — se requiere rol MEDICO
 *       404:
 *         description: Paciente no encontrado
 */
router.put('/:id',
    authMiddleware,
    requireRole('MEDICO', 'ADMINISTRADOR'),
    patientController.updatePatient
);

/**
 * @swagger
 * /patients/{id}:
 *   delete:
 *     summary: Eliminar un paciente (y sus análisis en cascada)
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Paciente eliminado
 *       401:
 *         description: Token inválido o faltante
 *       403:
 *         description: Acceso denegado — se requiere rol MEDICO
 *       404:
 *         description: Paciente no encontrado
 */
router.delete('/:id',
    authMiddleware,
    requireRole('MEDICO', 'ADMINISTRADOR'),
    patientController.deletePatient
);

module.exports = router;
