const rateLimit = require('express-rate-limit');

/**
 * Limitador para intentos de inicio de sesión.
 */
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10,
    message: { error: 'Demasiados intentos de acceso desde esta IP. Por seguridad, intenta de nuevo en 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Limitador para envío y verificación de OTP.
 */
const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 8, // Permite 8 intentos de OTP
    message: { error: 'Demasiados intentos con códigos de verificación. Por favor, intenta más tarde.' },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Limitador para recuperación y restablecimiento de contraseña.
 */
const resetPassLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // Límite estricto para recuperación
    message: { error: 'Demasiados intentos de recuperación de cuenta. Por seguridad, intenta más tarde.' },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = { loginLimiter, otpLimiter, resetPassLimiter };
