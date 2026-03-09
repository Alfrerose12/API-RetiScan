const rateLimit = require('express-rate-limit');

/**
 * Limitador de seguridad para evitar ataques de fuerza bruta en los endpoints de autenticación.
 * Bloquea la IP si intenta iniciar sesión o verificar OTPs más de 10 veces en 15 minutos.
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10, // 10 solicitudes por ventana por IP
    message: {
        error: 'Demasiados intentos de acceso desde esta IP. Por seguridad, intenta de nuevo en 15 minutos.',
    },
    standardHeaders: true, // Retorna detalles de límite en los headers `RateLimit-*`
    legacyHeaders: false, // Desactiva los headers antiguos `X-RateLimit-*`
});

module.exports = { authLimiter };
