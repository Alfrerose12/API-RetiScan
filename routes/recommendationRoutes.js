const { Router } = require('express');
const recommendationController = require('../controllers/recommendationController');
const authMiddleware = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/roleMiddleware');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Recommendations
 *   description: Recomendaciones y medicamentos para pacientes
 */

/**
 * @swagger
 * /recommendations:
 *   post:
 *     summary: Crear recomendación o medicamento para un paciente (MEDICO)
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RecommendationRequest'
 *     responses:
 *       201:
 *         description: Recomendación creada
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Paciente no encontrado
 */
router.post('/',
    authMiddleware,
    requireRole('MEDICO'),
    recommendationController.createRecommendation
);

/**
 * @swagger
 * /recommendations/my:
 *   get:
 *     summary: Obtener mis recomendaciones y medicamentos (PACIENTE)
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de recomendaciones del paciente
 */
router.get('/my',
    authMiddleware,
    requireRole('PACIENTE'),
    recommendationController.getMyRecommendations
);

/**
 * @swagger
 * /recommendations/patient/{patientId}:
 *   get:
 *     summary: Recomendaciones de un paciente (MEDICO)
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Lista de recomendaciones
 */
router.get('/patient/:patientId',
    authMiddleware,
    requireRole('MEDICO'),
    recommendationController.getPatientRecommendations
);

/**
 * @swagger
 * /recommendations/{id}/confirm:
 *   post:
 *     summary: Confirmar toma de medicamento (PACIENTE)
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Toma registrada con nuevo horario
 *       400:
 *         description: Solo se puede confirmar medicamentos
 */
router.post('/:id/confirm',
    authMiddleware,
    requireRole('PACIENTE'),
    recommendationController.confirmMedicationTaken
);

/**
 * @swagger
 * /recommendations/{id}/logs:
 *   get:
 *     summary: Historial de tomas de un medicamento
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Lista de tomas registradas
 */
router.get('/:id/logs',
    authMiddleware,
    recommendationController.getMedicationLogs
);

/**
 * @swagger
 * /recommendations/{id}:
 *   delete:
 *     summary: Desactivar recomendación (MEDICO)
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Recomendación desactivada
 */
router.delete('/:id',
    authMiddleware,
    requireRole('MEDICO'),
    recommendationController.deleteRecommendation
);

module.exports = router;
