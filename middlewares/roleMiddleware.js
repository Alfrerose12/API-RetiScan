/**
 * requireRole(...roles)
 *
 * Factory middleware that checks req.user.role against the allowed roles list.
 * Must be used AFTER authMiddleware so that req.user is populated.
 *
 * Usage:
 *   router.post('/', authMiddleware, requireRole('MEDICO'), controller.create)
 *   router.get('/',  authMiddleware, requireRole('MEDICO', 'PACIENTE'), controller.list)
 */
function requireRole(...allowedRoles) {
    return function (req, res, next) {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                error: `Access denied — requires role: ${allowedRoles.join(' or ')}`,
                yourRole: req.user.role,
            });
        }

        next();
    };
}

module.exports = requireRole;
