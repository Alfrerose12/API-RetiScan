const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * authMiddleware
 * Validates the Bearer token from the Authorization header.
 * Attaches the decoded payload to req.user.
 */
function authMiddleware(req, res, next) {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authorization token missing or malformed' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, env.JWT_SECRET);
        req.user = decoded; // { id, email, role, iat, exp }
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired — please log in again' });
        }
        return res.status(401).json({ error: 'Invalid token' });
    }
}

module.exports = authMiddleware;
