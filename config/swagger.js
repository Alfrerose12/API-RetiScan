const swaggerJsdoc = require('swagger-jsdoc');
const env = require('./env');

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
                url: '/api',
                description: 'Servidor actual (se adapta automáticamente al host)',
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
                // ── Auth ───────────────────────────────────────────────────────────
                DoctorRegisterRequest: {
                    type: 'object',
                    required: ['firstName', 'paternalSurname', 'email', 'password', 'licenseNumber'],
                    properties: {
                        firstName: { type: 'string', example: 'Juan', description: 'Nombre(s)' },
                        paternalSurname: { type: 'string', example: 'Pérez', description: 'Apellido Paterno' },
                        maternalSurname: { type: 'string', example: 'García', description: 'Apellido Materno (Opcional)' },
                        email: { type: 'string', format: 'email', example: 'doctor@hospital.com' },
                        password: { type: 'string', minLength: 6, example: 'SecurePass123' },
                        licenseNumber: { type: 'string', example: '12345678', description: 'Cédula profesional' },
                        specialty: { type: 'string', example: 'Oftalmología' },
                        institution: { type: 'string', example: 'Hospital General de México' },
                        phone: { type: 'string', example: '555-123-4567' },
                    },
                },
                // ── Users ──────────────────────────────────────────────────────────
                RegisterRequest: {
                    type: 'object',
                    required: ['email', 'firstName', 'paternalSurname', 'password'],
                    properties: {
                        email: { type: 'string', format: 'email', example: 'medico@retiscan.com' },
                        firstName: { type: 'string', example: 'Juan' },
                        paternalSurname: { type: 'string', example: 'Pérez' },
                        maternalSurname: { type: 'string', example: 'García' },
                        password: { type: 'string', minLength: 6, example: 'SecurePass123' },
                    },
                    description: 'Registro rápido (el rol se asigna por el dominio del correo)',
                },
                LoginRequest: {
                    type: 'object',
                    required: ['identifier', 'password'],
                    properties: {
                        identifier: { type: 'string', example: 'medico@retiscan.com', description: 'Email (médico) o username (paciente)' },
                        password: { type: 'string', example: 'SecurePass123' },
                    },
                },
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        username: { type: 'string', example: 'doctor.garcia' },
                        email: { type: 'string', format: 'email', nullable: true },
                        name: { type: 'string', example: 'Juan Pérez García', description: 'Nombre completo (construido desde el perfil)' },
                        role: { type: 'string', enum: ['MEDICO', 'PACIENTE'] },
                        is_verified: { type: 'boolean' },
                        subscription_end_date: { type: 'string', format: 'date-time', nullable: true },
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
                // ── Patients ──────────────────────────────────────────────────────────────────
                PatientRequest: {
                    type: 'object',
                    required: ['firstName', 'paternalSurname'],
                    description: 'El médico solo ingresa el nombre. birthDate, gender, email y phone los llena el paciente en su primer login.',
                    properties: {
                        firstName: { type: 'string', example: 'Juan' },
                        paternalSurname: { type: 'string', example: 'Pérez' },
                        maternalSurname: { type: 'string', example: 'García' },
                    },
                },

                Patient: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        doctor_id: { type: 'string', format: 'uuid' },
                        user_id: { type: 'string', format: 'uuid', nullable: true },
                        first_name: { type: 'string', example: 'Juan' },
                        paternal_surname: { type: 'string', example: 'Pérez' },
                        maternal_surname: { type: 'string', example: 'García', nullable: true },
                        birth_date: { type: 'string', format: 'date' },
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
                    required: ['patientId', 'eye'],
                    properties: {
                        patientId: { type: 'string', format: 'uuid', example: 'a1b2c3d4-...' },
                        eye: { type: 'string', enum: ['LEFT', 'RIGHT'] },
                        doctorNotes: { type: 'string', example: 'Paciente refiere visión borrosa desde hace 2 semanas' },
                        imageUri: { type: 'string', example: 'retiscan://uploads/fundus_20240301.png' },
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
                // ── Doctors ──────────────────────────────────────────────────────
                DoctorProfileRequest: {
                    type: 'object',
                    required: ['licenseNumber'],
                    properties: {
                        licenseNumber: { type: 'string', example: '1234567' },
                        specialty: { type: 'string', example: 'Oftalmología' },
                        institution: { type: 'string', example: 'Hospital General' },
                        phone: { type: 'string', example: '555-123-4567' },
                    },
                },
                DoctorProfile: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        user_id: { type: 'string', format: 'uuid' },
                        license_number: { type: 'string', example: '1234567' },
                        specialty: { type: 'string', nullable: true },
                        institution: { type: 'string', nullable: true },
                        phone: { type: 'string', nullable: true },
                        verified_at: { type: 'string', format: 'date-time', nullable: true },
                        created_at: { type: 'string', format: 'date-time' },
                    },
                },
                // ── Generic ────────────────────────────────────────────────────────
                // ── Recommendations ────────────────────────────────────────────────
                RecommendationRequest: {
                    type: 'object',
                    required: ['patientId', 'type', 'title'],
                    properties: {
                        patientId: { type: 'string', format: 'uuid' },
                        type: { type: 'string', enum: ['RECOMMENDATION', 'MEDICATION'], description: 'Tipo: recomendación general o medicamento' },
                        title: { type: 'string', example: 'Gotas Timolol 0.5%' },
                        description: { type: 'string', example: 'Aplicar 1 gota en cada ojo' },
                        dosage: { type: 'string', example: '1 gota cada 12 horas' },
                        frequencyHours: { type: 'integer', example: 12, description: 'Frecuencia de toma en horas (solo para medicamentos)' },
                    },
                },
                Recommendation: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        patient_id: { type: 'string', format: 'uuid' },
                        type: { type: 'string', enum: ['RECOMMENDATION', 'MEDICATION'] },
                        title: { type: 'string' },
                        description: { type: 'string', nullable: true },
                        dosage: { type: 'string', nullable: true },
                        frequency_hours: { type: 'integer', nullable: true },
                        next_dose_at: { type: 'string', format: 'date-time', nullable: true },
                        is_active: { type: 'boolean' },
                        created_by: { type: 'string', format: 'uuid' },
                        created_at: { type: 'string', format: 'date-time' },
                    },
                },
                MedicationLogEntry: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        recommendation_id: { type: 'string', format: 'uuid' },
                        taken_at: { type: 'string', format: 'date-time' },
                        next_dose_at: { type: 'string', format: 'date-time', nullable: true },
                    },
                },

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
    // Patrón glob para buscar comentarios JSDoc y @swagger
    apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);
module.exports = swaggerSpec;
