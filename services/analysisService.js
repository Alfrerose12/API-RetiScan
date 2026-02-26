/**
 * analysisService.js
 *
 * Implements an EventEmitter-based async processing pipeline that simulates
 * an AWS SQS / worker-queue pattern:
 *
 *  1. createAnalysis() → inserts record with status='PENDING' → emits 'analysis:queued'
 *  2. Listener catches the event (simulates a queue consumer / Lambda worker)
 *  3. Worker transitions status: PENDING → PROCESSING → COMPLETED
 *  4. AI_Processing_Log is created at start and completed at finish
 *
 * The artificial delay (2–5 s) simulates the real AI inference time.
 */

const EventEmitter = require('events');
const Analysis = require('../models/Analysis');
const Patient = require('../models/Patient');
const AI_Processing_Log = require('../models/AI_Processing_Log');

// ── Shared emitter (acts as the in-process "message broker") ───────────────
const analysisEmitter = new EventEmitter();

// ── Simulated AI result generator ─────────────────────────────────────────
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
            ? 'Annual follow-up recommended.'
            : 'Refer to ophthalmologist within 4 weeks.',
    };
}

// ── Queue consumer / async worker ─────────────────────────────────────────
analysisEmitter.on('analysis:queued', async ({ analysisId, patientId }) => {
    console.log(`[Queue] 📥 Received analysis job: ${analysisId}`);

    let logEntry;
    try {
        // 1. Create the audit log (records start_time)
        logEntry = await AI_Processing_Log.create(analysisId);
        console.log(`[Queue] 📝 Log entry created: ${logEntry.task_id}`);

        // 2. Transition → PROCESSING
        await Analysis.updateStatus(analysisId, 'PROCESSING', null);
        console.log(`[Queue] ⚙️  Analysis ${analysisId} → PROCESSING`);

        // 3. Simulate AI inference delay (2000–5000 ms)
        const delay = 2000 + Math.floor(Math.random() * 3000);
        await new Promise((resolve) => setTimeout(resolve, delay));

        // 4. Generate mock AI result
        const aiResult = generateMockAIResult();

        // 5. Transition → COMPLETED
        await Analysis.updateStatus(analysisId, 'COMPLETED', aiResult);
        console.log(`[Queue] ✅ Analysis ${analysisId} → COMPLETED (grade: ${aiResult.grade})`);

        // 6. Increment patient analytics
        await Patient.incrementAnalyses(patientId);

        // 7. Complete the audit log
        await AI_Processing_Log.complete(logEntry.task_id, 'COMPLETED');
        console.log(`[Queue] 🗒️  Log completed — duration recorded`);

    } catch (err) {
        console.error(`[Queue] ❌ Error processing analysis ${analysisId}:`, err.message);

        // Mark analysis as FAILED so clients aren't stuck polling PROCESSING
        await Analysis.updateStatus(analysisId, 'FAILED', { error: err.message }).catch(() => { });

        // Still try to close the audit log
        if (logEntry) {
            await AI_Processing_Log.complete(logEntry.task_id, 'FAILED').catch(() => { });
        }
    }
});

// ── Service API ────────────────────────────────────────────────────────────
const analysisService = {
    /**
     * Create a new analysis and dispatch it to the async worker via the emitter.
     * Returns immediately with the PENDING record — the caller does NOT wait for AI.
     *
     * @param {string} patientId
     */
    async createAnalysis(patientId) {
        if (!patientId) {
            const err = new Error('patientId is required');
            err.statusCode = 400;
            throw err;
        }

        // Insert with status = 'PENDING'
        const analysis = await Analysis.create(patientId);
        console.log(`[Service] 🚀 Analysis created: ${analysis.id} | Status: PENDING`);

        // Fire-and-forget: emit the job to the worker (mimics SQS sendMessage)
        setImmediate(() => {
            analysisEmitter.emit('analysis:queued', {
                analysisId: analysis.id,
                patientId: analysis.patient_id,
            });
        });

        return analysis; // Returns PENDING record to the HTTP client immediately
    },

    /** Retrieve a single analysis by UUID. */
    async getById(id) {
        const analysis = await Analysis.findById(id);
        if (!analysis) {
            const err = new Error('Analysis not found');
            err.statusCode = 404;
            throw err;
        }
        return analysis;
    },

    /** Retrieve all analyses for a patient. */
    async getByPatientId(patientId) {
        return Analysis.findByPatientId(patientId);
    },

    /** Get all processing logs for an analysis. */
    async getLogsForAnalysis(analysisId) {
        return AI_Processing_Log.findByAnalysisId(analysisId);
    },

    /** Delete an analysis. */
    async delete(id) {
        const deleted = await Analysis.deleteById(id);
        if (!deleted) {
            const err = new Error('Analysis not found');
            err.statusCode = 404;
            throw err;
        }
        return deleted;
    },
};

module.exports = analysisService;
