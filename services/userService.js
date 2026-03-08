const User = require('../models/User');

const userService = {
    /** Obtiene el perfil completo del usuario (sin contraseña). */
    async getProfile(id) {
        const user = await User.findById(id);
        if (!user) {
            const err = new Error('Usuario no encontrado');
            err.statusCode = 404;
            throw err;
        }
        return user;
    },

    /** Actualiza los campos del usuario. */
    async update(id, fields) {
        const updated = await User.updateById(id, fields);
        if (!updated) {
            const err = new Error('Usuario no encontrado');
            err.statusCode = 404;
            throw err;
        }
        return updated;
    },

    /** Elimina una cuenta de usuario. */
    async delete(id) {
        const deleted = await User.deleteById(id);
        if (!deleted) {
            const err = new Error('Usuario no encontrado');
            err.statusCode = 404;
            throw err;
        }
        return deleted;
    },

    /**
     * Cambia la contraseña del usuario y borra la bandera must_change_password.
     * @param {string} id - UUID del usuario
     * @param {string} newPassword
     */
    async changePassword(id, newPassword) {
        const updated = await User.changePassword(id, newPassword);
        if (!updated) {
            const err = new Error('Usuario no encontrado');
            err.statusCode = 404;
            throw err;
        }
        return updated;
    },
};

module.exports = userService;
