const userService = require('../services/userService');

const userController = {

    /** GET /api/users/profile  (requiere autenticación) */
    async getProfile(req, res, next) {
        try {
            const user = await userService.getProfile(req.user.id);
            return res.status(200).json({ user });
        } catch (err) {
            next(err);
        }
    },

    /** PUT /api/users/profile  (requiere autenticación) */
    async updateProfile(req, res, next) {
        try {
            const updated = await userService.update(req.user.id, req.body);
            return res.status(200).json({ message: 'Perfil actualizado', user: updated });
        } catch (err) {
            next(err);
        }
    },

    /** DELETE /api/users/:id  (requiere autenticación) */
    async deleteUser(req, res, next) {
        try {
            await userService.delete(req.params.id);
            return res.status(200).json({ message: 'Usuario eliminado exitosamente' });
        } catch (err) {
            next(err);
        }
    },

    /** PUT /api/users/change-password  (requiere autenticación) */
    async changePassword(req, res, next) {
        try {
            const { newPassword } = req.body;
            if (!newPassword || newPassword.length < 6) {
                return res.status(400).json({ error: 'newPassword debe tener al menos 6 caracteres' });
            }
            const user = await userService.changePassword(req.user.id, newPassword);
            return res.status(200).json({
                message: 'Contraseña actualizada exitosamente',
                user,
            });
        } catch (err) {
            next(err);
        }
    },
};

module.exports = userController;
