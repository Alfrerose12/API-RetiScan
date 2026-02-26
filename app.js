const env = require('./config/env');

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const routes = require('./routes');
const errorMiddleware = require('./middlewares/errorMiddleware');

const app = express();
const PORT = env.PORT;

// ── Global Middleware ──────────────────────────────────────────────────────
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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

// Expose raw OpenAPI JSON spec (useful for Postman import / code-gen tools)
app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

// ── API Routes ─────────────────────────────────────────────────────────────
app.use('/api', routes);

// ── 404 Handler ────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// ── Global Error Handler (must be last) ───────────────────────────────────
app.use(errorMiddleware);

// ── Start Server ───────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`\n🚀 RetiScan API running on http://localhost:${PORT}`);
    console.log(`   Environment : ${env.NODE_ENV}`);
    console.log(`   Health check: http://localhost:${PORT}/api/health`);
    console.log(`   Swagger UI  : http://localhost:${PORT}/api/docs`);
    console.log(`   OpenAPI JSON: http://localhost:${PORT}/api/docs.json\n`);
});

module.exports = app;
