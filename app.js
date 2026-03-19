const env = require('./config/env');

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const routes = require('./routes');
const errorMiddleware = require('./middlewares/errorMiddleware');

const app = express();
const PORT = env.PORT;

// ── Middleware Global ──────────────────────────────────────────────────────
app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        return callback(null, origin);
    },
    credentials: true // Obligatorio para enviar/recibir cookies HttpOnly
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('public')); // Sirve /public/index.html en /

// ── Swagger UI ─────────────────────────────────────────────────────────────
const swaggerUiOptions = {
    customSiteTitle: 'RetiScan API Docs',
    customCss: `
    .swagger-ui .topbar { background-color: #1a1a2e; }
    .swagger-ui .topbar .download-url-wrapper { display: none; }
    .swagger-ui .info .title { color: #e94560; }
  `,
    swaggerOptions: {
        persistAuthorization: false, // Token se limpia en cada recarga
        filter: true,
        displayRequestDuration: true,
    },
};

app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, swaggerUiOptions)
);

// Expone la especificación OpenAPI en formato crudo JSON (útil para importar en Postman / herramientas de generación de código)
app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

// ── Rutas de la API ─────────────────────────────────────────────────────────────
app.use('/api', routes);

// ── Manejador 404 ────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// ── Manejador Global de Errores (debe ir al final) ───────────────────────────────────
app.use(errorMiddleware);

// ── Iniciar Servidor ───────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`\n🚀 RetiScan API corriendo en http://localhost:${PORT}`);
    console.log(`   Entorno : ${env.NODE_ENV}`);
    console.log(`   Health check: http://localhost:${PORT}/api/health`);
    console.log(`   Swagger UI  : http://localhost:${PORT}/api/docs`);
    console.log(`   OpenAPI JSON: http://localhost:${PORT}/api/docs.json\n`);
});

module.exports = app;
