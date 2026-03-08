const { Router } = require('express');
const analysisController = require('../controllers/analysisController');
const authMiddleware = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/roleMiddleware');
const subscriptionMiddleware = require('../middlewares/subscriptionMiddleware');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Analyses
 *   description: Análisis de retinopatía con pipeline de IA asíncrono
 */

/**
 * @swagger
 * /analyses:
 *   post:
 *     summary: Crear análisis (dispara pipeline de IA asíncrono)
 *     description: |
 *       La respuesta es 202 Accepted con status PENDING.
 *       El sistema procesa en background: PENDING → PROCESSING → COMPLETED.
 *       Haz polling a GET /analyses/:id para obtener el resultado.
 *     tags: [Analyses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AnalysisRequest'
 *     responses:
 *       202:
 *         description: Análisis en cola con status PENDING
 *       400:
 *         description: patientId o eye inválidos
 *       402:
 *         description: Suscripción inactiva o expirada
 *       403:
 *         description: Se requiere rol MEDICO
 *       404:
 *         description: Paciente no encontrado o no pertenece a este médico
 */
router.post('/',
    authMiddleware,
    requireRole('MEDICO'),
    subscriptionMiddleware,
    analysisController.createAnalysis
);

/**
 * @swagger
 * /analyses/my:
 *   get:
 *     summary: Ver mis análisis (solo PACIENTE)
 *     tags: [Analyses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de análisis del paciente autenticado
 */
router.get('/my',
    authMiddleware,
    requireRole('PACIENTE'),
    analysisController.getMyAnalyses
);

/**
 * @swagger
 * /analyses/patient/{patientId}:
 *   get:
 *     summary: Listar análisis de un paciente (solo del médico autenticado)
 *     tags: [Analyses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Lista de análisis del paciente
 */
router.get('/patient/:patientId',
    authMiddleware,
    requireRole('MEDICO'),
    analysisController.getAnalysisByPatient
);

/**
 * @swagger
 * /analyses/{id}:
 *   get:
 *     summary: Obtener análisis por ID (polling de status)
 *     tags: [Analyses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Datos del análisis (status cambia con el tiempo)
 *       404:
 *         description: Análisis no encontrado
 */
router.get('/:id',
    authMiddleware,
    requireRole('MEDICO'),
    analysisController.getAnalysisById
);

/**
 * @swagger
 * /analyses/{id}/logs:
 *   get:
 *     summary: Logs de auditoría del procesamiento de IA
 *     tags: [Analyses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Logs de procesamiento
 */
router.get('/:id/logs',
    authMiddleware,
    requireRole('MEDICO'),
    analysisController.getAnalysisLogs
);

/**
 * @swagger
 * /analyses/{id}:
 *   delete:
 *     summary: Eliminar análisis (solo del médico autenticado)
 *     tags: [Analyses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Análisis eliminado
 *       402:
 *         description: Suscripción inactiva o expirada
 *       404:
 *         description: Análisis no encontrado
 */
router.delete('/:id',
    authMiddleware,
    requireRole('MEDICO'),
    subscriptionMiddleware,
    analysisController.deleteAnalysis
);

module.exports = router;
