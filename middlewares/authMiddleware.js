const jwt = require('jsonwebtoken');
const env = require('../config/env');
const pool = require('../config/database');

/**
 * authMiddleware
 * Valida el token Bearer del encabezado de Autorización.
 * Revisa que el token no haya sido invalidado (Lista Negra)
 * Adjunta el payload a req.user y el string a req.token.
 */
async function authMiddleware(req, res, next) {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'TOKEN_MISSING' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Verificar Lista Negra
        const blCheck = await pool.query('SELECT 1 FROM blacklisted_tokens WHERE token = $1', [token]);
        if (blCheck.rows.length > 0) {
            return res.status(401).json({ error: 'TOKEN_INVALID' });
        }

        const decoded = jwt.verify(token, env.JWT_SECRET);
        req.user = decoded; // { id, email, role, iat, exp }
        req.token = token;  // Necesario para el logout
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'TOKEN_EXPIRED' });
        }
        return res.status(401).json({ error: 'TOKEN_INVALID' });
    }
}

module.exports = authMiddleware;
