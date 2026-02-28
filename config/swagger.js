const swaggerJsdoc = require('swagger-jsdoc');
const os = require('os');
const env = require('./env');

/**
 * Detecta la IP LAN de la máquina en tiempo de ejecución.
 * Ignora loopback (127.x) e interfaces internas de Docker (172.x).
 * Si no encuentra ninguna, devuelve 'localhost' como fallback.
 */
function getLanIP() {
    const interfaces = os.networkInterfaces();
    for (const iface of Object.values(interfaces)) {
        for (const addr of iface) {
            if (addr.family === 'IPv4' && !addr.internal && !addr.address.startsWith('172.')) {
                return addr.address;
            }
        }
    }
    return 'localhost';
}

const LAN_IP = getLanIP();

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'RetiScan API',
            version: '1.0.0',
            description:
                'REST API para la plataforma de detección de retinopatía diabética RetiScan. ' +
                'Incluye gestión de usuarios, pacientes, análisis de IA asíncrono ' +
                'y logs de auditoría del procesamiento.',
            contact: {
                name: 'RetiScan Dev Team',
            },
        },
        servers: [
            {
                url: `http://localhost:${env.PORT}/api`,
                description: 'Local (misma máquina)',
            },
            {
                url: `http://${LAN_IP}:${env.PORT}/api`,
                description: `Red local (LAN) — ${LAN_IP}`,
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Ingresa el token JWT obtenido en /users/login',
                },
            },
            schemas: {
                // ── Users ──────────────────────────────────────────────────────────
                RegisterRequest: {
                    type: 'object',
                    required: ['email', 'name', 'password'],
                    properties: {
                        email: { type: 'string', format: 'email', example: 'medico@retiscan.com' },
                        name: { type: 'string', example: 'Dr. García López' },
                        password: { type: 'string', minLength: 6, example: 'SecurePass123' },
                    },
                    description: 'El rol se asigna automáticamente: @retiscan.com → MEDICO, @yada.com → ADMINISTRADOR, otros → PACIENTE',
                },
                LoginRequest: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: { type: 'string', format: 'email', example: 'medico@retiscan.com' },
                        password: { type: 'string', example: 'SecurePass123' },
                    },
                },
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        email: { type: 'string', format: 'email' },
                        name: { type: 'string', example: 'Dr. García López' },
                        role: { type: 'string', enum: ['MEDICO', 'PACIENTE', 'ADMINISTRADOR'] },
                        created_at: { type: 'string', format: 'date-time' },
                        updated_at: { type: 'string', format: 'date-time' },
                    },
                },
                LoginResponse: {
                    type: 'object',
                    properties: {
                        message: { type: 'string', example: 'Login successful' },
                        token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR...' },
                        user: { $ref: '#/components/schemas/User' },
                    },
                },
                // ── Patients ───────────────────────────────────────────────────────
                PatientRequest: {
                    type: 'object',
                    required: ['fullName', 'age'],
                    properties: {
                        fullName: { type: 'string', example: 'Juan Pérez García' },
                        age: { type: 'integer', minimum: 1, maximum: 149, example: 52 },
                        phone: { type: 'string', example: '555-123-4567' },
                    },
                },
                Patient: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        doctor_id: { type: 'string', format: 'uuid', nullable: true },
                        full_name: { type: 'string' },
                        age: { type: 'integer' },
                        phone: { type: 'string', nullable: true },
                        last_visit: { type: 'string', format: 'date-time', nullable: true },
                        total_analyses: { type: 'integer' },
                        created_at: { type: 'string', format: 'date-time' },
                        updated_at: { type: 'string', format: 'date-time' },
                    },
                },
                // ── Analysis ───────────────────────────────────────────────────────
                AnalysisRequest: {
                    type: 'object',
                    required: ['patientId'],
                    properties: {
                        patientId: { type: 'string', format: 'uuid', example: 'a1b2c3d4-...' },
                    },
                },
                AIResult: {
                    type: 'object',
                    nullable: true,
                    properties: {
                        model_version: { type: 'string', example: 'RetiScan-AI v1.0-mock' },
                        processed_at: { type: 'string', format: 'date-time' },
                        grade: { type: 'string', enum: ['No DR', 'Mild', 'Moderate', 'Severe', 'Proliferative DR'] },
                        confidence: { type: 'number', format: 'float', example: 0.9213 },
                        lesions_detected: {
                            type: 'object',
                            properties: {
                                microaneurysms: { type: 'boolean' },
                                hemorrhages: { type: 'boolean' },
                                hard_exudates: { type: 'boolean' },
                                neovascularization: { type: 'boolean' },
                            },
                        },
                        recommendation: { type: 'string', example: 'Refer to ophthalmologist within 4 weeks.' },
                    },
                },
                Analysis: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        patient_id: { type: 'string', format: 'uuid' },
                        status: { type: 'string', enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'] },
                        ai_result: { $ref: '#/components/schemas/AIResult' },
                        created_at: { type: 'string', format: 'date-time' },
                        updated_at: { type: 'string', format: 'date-time' },
                    },
                },
                // ── AI Processing Log ──────────────────────────────────────────────
                AIProcessingLog: {
                    type: 'object',
                    properties: {
                        task_id: { type: 'string', example: 'task_abc123' },
                        analysis_id: { type: 'string', format: 'uuid' },
                        start_time: { type: 'string', format: 'date-time' },
                        end_time: { type: 'string', format: 'date-time', nullable: true },
                        status: { type: 'string', enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'], nullable: true },
                    },
                },
                // ── Generic ────────────────────────────────────────────────────────
                Error: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' },
                    },
                },
            },
        },
        security: [{ bearerAuth: [] }],
    },
    // Glob pattern to scan for JSDoc @swagger comments
    apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);
module.exports = swaggerSpec;
