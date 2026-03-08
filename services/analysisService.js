/**
 * analysisService.js
 *
 * Implementa el pipeline de procesamiento asíncrono basado en EventEmitter
 * con aislamiento multi-tenant (doctor_id) y nuevos campos (eye, doctor_notes).
 */

const EventEmitter = require('events');
const Analysis = require('../models/Analysis');
const Patient = require('../models/Patient');
const AI_Processing_Log = require('../models/AI_Processing_Log');

// ── Emisor compartido (actúa como el "message broker" en el proceso) ────────
const analysisEmitter = new EventEmitter();

// ── Generador simulado de resultados de IA ─────────────────────────────────
function generateMockAIResult() {
    const grades = ['No DR', 'Mild', 'Moderate', 'Severe', 'Proliferative DR'];
    const grade = grades[Math.floor(Math.random() * grades.length)];
    return {
        model_version: 'RetiScan-AI v1.0-mock',
        processed_at: new Date().toISOString(),
        grade,
        confidence: parseFloat((0.75 + Math.random() * 0.24).toFixed(4)),
        lesions_detected: {
            microaneurysms: Math.random() > 0.5,
            hemorrhages: Math.random() > 0.6,
            hard_exudates: Math.random() > 0.7,
            neovascularization: grade === 'Proliferative DR',
        },
        recommendation: grade === 'No DR'
            ? 'Seguimiento anual recomendado.'
            : 'Referir al oftalmólogo en menos de 4 semanas.',
    };
}

// ── Consumidor de cola / trabajador asíncrono ──────────────────────────────
analysisEmitter.on('analysis:queued', async ({ analysisId, patientId }) => {
    console.log(`[Cola] 📥 Trabajo de análisis recibido: ${analysisId}`);

    let logEntry;
    try {
        // 1. Crear el registro de auditoría (registra start_time)
        logEntry = await AI_Processing_Log.create(analysisId);
        console.log(`[Cola] 📝 Log creado: ${logEntry.task_id}`);

        // 2. Transición → PROCESSING
        await Analysis.updateStatus(analysisId, 'PROCESSING', null);
        console.log(`[Cola] ⚙️  Análisis ${analysisId} → PROCESSING`);

        // 3. Simular retraso de inferencia de IA (2000-5000 ms)
        const delay = 2000 + Math.floor(Math.random() * 3000);
        await new Promise((resolve) => setTimeout(resolve, delay));

        // 4. Generar resultado de IA simulado
        const aiResult = generateMockAIResult();

        // 5. Transición → COMPLETED
        await Analysis.updateStatus(analysisId, 'COMPLETED', aiResult);
        console.log(`[Cola] ✅ Análisis ${analysisId} → COMPLETED (grado: ${aiResult.grade})`);

        // 6. Incrementar análisis del paciente
        await Patient.incrementAnalyses(patientId);

        // 7. Completar el registro de auditoría
        await AI_Processing_Log.complete(logEntry.task_id, 'COMPLETED');
        console.log(`[Cola] 🗒️  Log completado`);

    } catch (err) {
        console.error(`[Cola] ❌ Error procesando análisis ${analysisId}:`, err.message);

        // Marcar análisis como FAILED para que los clientes no se queden haciendo polling
        await Analysis.updateStatus(analysisId, 'FAILED', { error: err.message }).catch(() => { });

        // Intentar cerrar el registro de auditoría de todas formas
        if (logEntry) {
            await AI_Processing_Log.complete(logEntry.task_id, 'FAILED').catch(() => { });
        }
    }
});

// ── API del servicio ───────────────────────────────────────────────────────
const analysisService = {
    /**
     * Crea un nuevo análisis con aislamiento de médico y lo envía al worker.
     * Devuelve inmediatamente el registro PENDING — el cliente hace polling.
     *
     * @param {{ patientId, doctorId, eye, imageUri?, doctorNotes? }} params
     */
    async createAnalysis({ patientId, doctorId, eye, imageUri, doctorNotes }) {
        if (!patientId) {
            const err = new Error('patientId es requerido');
            err.statusCode = 400;
            throw err;
        }
        if (!eye || !['LEFT', 'RIGHT'].includes(eye)) {
            const err = new Error('eye debe ser LEFT o RIGHT');
            err.statusCode = 400;
            throw err;
        }

        // Verificar que el paciente pertenece al médico
        const patient = await Patient.findByIdAndDoctor(patientId, doctorId);
        if (!patient) {
            const err = new Error('Paciente no encontrado o no pertenece a este médico');
            err.statusCode = 404;
            throw err;
        }

        // Insertar con estado = 'PENDING'
        const analysis = await Analysis.create(patientId, doctorId, eye, imageUri, doctorNotes);
        console.log(`[Servicio] 🚀 Análisis creado: ${analysis.id} | Status: PENDING`);

        // Fire-and-forget: emite el trabajo al trabajador
        setImmediate(() => {
            analysisEmitter.emit('analysis:queued', {
                analysisId: analysis.id,
                patientId: analysis.patient_id,
            });
        });

        return analysis;
    },

    /** Recupera un solo análisis por UUID, con verificación de dueño (médico o paciente). */
    async getById(id, doctorId) {
        const analysis = await Analysis.findByIdAndDoctor(id, doctorId);
        if (!analysis) {
            const err = new Error('Análisis no encontrado');
            err.statusCode = 404;
            throw err;
        }
        return analysis;
    },

    /** Recupera todos los análisis de un paciente (filtrado por doctor). */
    async getByPatientAndDoctor(patientId, doctorId) {
        return Analysis.findByPatientAndDoctor(patientId, doctorId);
    },

    /** Recupera todos los análisis que puede ver un paciente (por su user_id). */
    async getByPatientUserId(userId) {
        const patient = await Patient.findByUserId(userId);
        if (!patient) return [];
        return Analysis.findByPatientId(patient.id);
    },

    /** Obtiene todos los logs de procesamiento para un análisis. */
    async getLogsForAnalysis(analysisId) {
        return AI_Processing_Log.findByAnalysisId(analysisId);
    },

    /** Elimina un análisis (con verificación de propiedad). */
    async delete(id, doctorId) {
        const deleted = await Analysis.deleteByIdAndDoctor(id, doctorId);
        if (!deleted) {
            const err = new Error('Análisis no encontrado');
            err.statusCode = 404;
            throw err;
        }
        return deleted;
    },
};

module.exports = analysisService;
