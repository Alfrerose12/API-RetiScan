const { Router } = require('express');
const patientController = require('../controllers/patientController');
const authMiddleware = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/roleMiddleware');
const subscriptionMiddleware = require('../middlewares/subscriptionMiddleware');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Patients
 *   description: Gestión de pacientes (aislamiento por médico)
 */

/**
 * @swagger
 * /patients:
 *   post:
 *     summary: Registrar un nuevo paciente (genera credenciales automáticamente)
 *     description: |
 *       Crea el registro de paciente y genera automáticamente su cuenta de acceso:
 *       - Se genera un `username` único (`nombre.apellido#XXXX`)
 *       - Se genera una contraseña temporal de 12 caracteres
 *       - El paciente debe cambiar su contraseña en el primer login
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
 *         description: Paciente creado con credenciales generadas
 *       400:
 *         description: fullName y birthDate son requeridos
 *       401:
 *         description: Token inválido o faltante
 *       402:
 *         description: Suscripción inactiva o expirada
 *       403:
 *         description: Se requiere rol MEDICO
 */
router.post('/',
    authMiddleware,
    requireRole('MEDICO'),
    subscriptionMiddleware,
    patientController.createPatient
);

/**
 * @swagger
 * /patients/me:
 *   get:
 *     summary: Ver mi registro de paciente (solo PACIENTE)
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Registro del paciente autenticado
 *       404:
 *         description: No se encontró registro de paciente
 */
router.get('/me',
    authMiddleware,
    requireRole('PACIENTE'),
    patientController.getMyPatientRecord
);

/**
 * @swagger
 * /patients/me:
 *   patch:
 *     summary: El paciente completa su perfil en el primer login
 *     description: |
 *       Formulario que el paciente llena la primera vez que inicia sesión:
 *       fecha de nacimiento, género, correo y teléfono.
 *       Estos datos fueron dejados vacíos al crearlo el médico.
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               birthDate: { type: string, format: date, example: '1998-05-14' }
 *               gender:    { type: string, enum: [MASCULINO, FEMENINO, OTRO] }
 *               email:     { type: string, format: email, example: 'paciente@gmail.com' }
 *               phone:     { type: string, example: '555-987-6543' }
 *     responses:
 *       200:
 *         description: Perfil actualizado exitosamente
 *       400:
 *         description: Género inválido
 *       404:
 *         description: Registro de paciente no encontrado
 */
router.patch('/me',
    authMiddleware,
    requireRole('PACIENTE'),
    patientController.updateMyProfile
);

/**
 * @swagger
 * /patients:
 *   get:
 *     summary: Listar todos los pacientes del médico autenticado
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de pacientes del médico
 *       403:
 *         description: Se requiere rol MEDICO
 */
router.get('/',
    authMiddleware,
    requireRole('MEDICO'),
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
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Datos del paciente
 *       403:
 *         description: Se requiere rol MEDICO
 *       404:
 *         description: Paciente no encontrado o no pertenece a este médico
 */
router.get('/:id',
    authMiddleware,
    requireRole('MEDICO'),
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
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Paciente actualizado
 *       402:
 *         description: Suscripción inactiva o expirada
 *       404:
 *         description: Paciente no encontrado
 */
router.put('/:id',
    authMiddleware,
    requireRole('MEDICO'),
    subscriptionMiddleware,
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
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Paciente eliminado
 *       402:
 *         description: Suscripción inactiva o expirada
 *       404:
 *         description: Paciente no encontrado
 */
router.delete('/:id',
    authMiddleware,
    requireRole('MEDICO'),
    subscriptionMiddleware,
    patientController.deletePatient
);

module.exports = router;
