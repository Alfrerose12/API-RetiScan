/**
 * errorMiddleware.js
 *
 * Global Express error handler. Must be registered LAST in app.js
 * (after all routes) and must have exactly 4 parameters.
 *
 * Services throw Errors with an optional .statusCode property.
 * This middleware reads that code so controllers don't need to.
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
