const { Router } = require('express');
const analysisController = require('../controllers/analysisController');
const authMiddleware = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/roleMiddleware');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Analyses
 *   description: >
 *     Análisis de retinopatía con pipeline de IA asíncrono.
 *     Al crear un análisis, la respuesta es 202 Accepted con status PENDING.
 *     El sistema lo procesa en background (PENDING → PROCESSING → COMPLETED).
 *     Haz polling a GET /analyses/:id para obtener el resultado.
 */

/**
 * @swagger
 * /analyses:
 *   post:
 *     summary: Crear un nuevo análisis (dispara pipeline de IA asíncrono)
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
 *         description: >
 *           Análisis en cola — devuelve el registro con status PENDING.
 *           El AI result se completará asíncronamente en 2–5 segundos.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:  { type: string }
 *                 analysis: { $ref: '#/components/schemas/Analysis' }
 *       400:
 *         description: patientId es requerido
 *       401:
 *         description: Token inválido o faltante
 *       403:
 *         description: Acceso denegado — se requiere rol MEDICO
 */
router.post('/',
    authMiddleware,
    requireRole('MEDICO'),
    analysisController.createAnalysis
);

/**
 * @swagger
 * /analyses/patient/{patientId}:
 *   get:
 *     summary: Listar todos los análisis de un paciente
 *     tags: [Analyses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID del paciente
 *     responses:
 *       200:
 *         description: Lista de análisis del paciente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                 analyses:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Analysis'
 *       401:
 *         description: Token inválido o faltante
 */
router.get('/patient/:patientId',
    authMiddleware,
    requireRole('MEDICO', 'PACIENTE'),
    analysisController.getAnalysisByPatient
);

/**
 * @swagger
 * /analyses/{id}:
 *   get:
 *     summary: Obtener un análisis por ID (polling de status)
 *     tags: [Analyses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID del análisis
 *     responses:
 *       200:
 *         description: >
 *           Datos del análisis. El campo `status` cambia de
 *           PENDING → PROCESSING → COMPLETED mientras la IA trabaja.
 *           El campo `ai_result` estará disponible al llegar a COMPLETED.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 analysis: { $ref: '#/components/schemas/Analysis' }
 *       401:
 *         description: Token inválido o faltante
 *       404:
 *         description: Análisis no encontrado
 */
router.get('/:id',
    authMiddleware,
    requireRole('MEDICO', 'PACIENTE'),
    analysisController.getAnalysisById
);

/**
 * @swagger
 * /analyses/{id}/logs:
 *   get:
 *     summary: Obtener logs de auditoría del procesamiento de IA
 *     tags: [Analyses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID del análisis
 *     responses:
 *       200:
 *         description: Logs de procesamiento (incluye started_at, finished_at, duration_ms)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                 logs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AIProcessingLog'
 *       401:
 *         description: Token inválido o faltante
 *       403:
 *         description: Acceso denegado — se requiere rol MEDICO
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
 *     summary: Eliminar un análisis (y sus logs en cascada)
 *     tags: [Analyses]
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
 *         description: Análisis eliminado
 *       401:
 *         description: Token inválido o faltante
 *       403:
 *         description: Acceso denegado — se requiere rol MEDICO
 *       404:
 *         description: Análisis no encontrado
 */
router.delete('/:id',
    authMiddleware,
    requireRole('MEDICO'),
    analysisController.deleteAnalysis
);

module.exports = router;
