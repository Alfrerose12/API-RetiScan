const adminService = require('../services/adminService');

const adminController = {
    /**
     * POST /api/admin/doctors
     * Body: { name }
     * Crea un médico con email @retiscan.com y contraseña temporal generados automáticamente.
     */
    async createDoctor(req, res, next) {
        try {
            const { name } = req.body;
            if (!name || typeof name !== 'string' || !name.trim()) {
                return res.status(400).json({ error: 'El campo "name" es requerido' });
            }

            const { user, tempPassword } = await adminService.createDoctor(name.trim());

            return res.status(201).json({
                message: 'Médico creado exitosamente',
                user,
                tempPassword,
                note: 'Comparte estas credenciales con el médico. Deberá cambiar su contraseña al primer inicio de sesión.',
            });
        } catch (err) {
            next(err);
        }
    },

    /**
     * GET /api/admin/doctors
     * Lista todos los usuarios con rol MEDICO.
     */
    async listDoctors(req, res, next) {
        try {
            const doctors = await adminService.listDoctors();
            return res.json({ total: doctors.length, doctors });
        } catch (err) {
            next(err);
        }
    },

    /**
     * DELETE /api/admin/doctors/:id
     * Elimina un médico por ID (solo si su rol es MEDICO).
     */
    async deleteDoctor(req, res, next) {
        try {
            const { id } = req.params;
            await adminService.deleteDoctor(id);
            return res.json({ message: 'Médico eliminado exitosamente' });
        } catch (err) {
            next(err);
        }
    },
};

module.exports = adminController;
