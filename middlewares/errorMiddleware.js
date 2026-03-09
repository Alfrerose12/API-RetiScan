/**
 * errorMiddleware.js
 *
 * Manejador global de errores de Express. Debe registrarse al FINAL en app.js
 * (después de todas las rutas) y debe tener exactamente 4 parámetros.
 *
 * Los servicios lanzan Errores con una propiedad opcional .statusCode.
 * Este middleware lee ese código para que los controladores no tengan que hacerlo.
 */

// eslint-disable-next-line no-unused-vars
function errorMiddleware(err, req, res, next) {
    const statusCode = err.statusCode || 500;
    const isDev = process.env.NODE_ENV === 'development';

    console.error(`[Error] ${req.method} ${req.path} — ${err.message}`);

    return res.status(statusCode).json({
        error: err.message || 'Internal Server Error',
        ...(isDev && { stack: err.stack }),
    });
}

module.exports = errorMiddleware;
