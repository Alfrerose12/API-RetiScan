/**
 * requireRole(...roles)
 *
 * Middleware factoría que verifica req.user.role contra la lista de roles permitidos.
 * Debe usarse DESPUÉS de authMiddleware para que req.user esté poblado.
 *
 * Uso:
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
