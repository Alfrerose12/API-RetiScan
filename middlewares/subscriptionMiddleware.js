/**
 * subscriptionMiddleware.js
 *
 * Bloquea operaciones de escritura (POST/PUT/DELETE) para médicos
 * cuya suscripción ha expirado o no tienen suscripción activa.
 * Los métodos GET siempre están permitidos.
 *
 * Responde con 402 Payment Required si la suscripción expiró.
 * Debe usarse DESPUÉS de authMiddleware en rutas de MEDICO.
 */
function subscriptionMiddleware(req, res, next) {
    // Solo aplica restricciones a médicos
    if (req.user?.role !== 'MEDICO') return next();

    // GET siempre permitido (lectura de datos propios)
    const readOnlyMethods = ['GET', 'HEAD', 'OPTIONS'];
    if (readOnlyMethods.includes(req.method)) return next();

    // Verificar suscripción activa
    const endDate = req.user.subscription_end_date;

    if (!endDate || new Date(endDate) < new Date()) {
        return res.status(402).json({
            error: 'Suscripción inactiva o expirada',
            message: 'Tu suscripción ha expirado. Renueva tu plan para crear o modificar datos.',
            subscription_end_date: endDate || null,
        });
    }

    next();
}

module.exports = subscriptionMiddleware;
