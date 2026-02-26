const userService = require('../services/userService');

const userController = {
    /** POST /api/users/register */
    async register(req, res, next) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ error: 'email and password are required' });
            }
            const user = await userService.register(email, password);
            return res.status(201).json({ message: 'User registered successfully', user });
        } catch (err) {
            next(err);
        }
    },

    /** POST /api/users/login */
    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ error: 'email and password are required' });
            }
            const result = await userService.login(email, password);
            return res.status(200).json({ message: 'Login successful', ...result });
        } catch (err) {
            next(err);
        }
    },

    /** GET /api/users/profile  (requires auth) */
    async getProfile(req, res, next) {
        try {
            const user = await userService.getProfile(req.user.id);
            return res.status(200).json({ user });
        } catch (err) {
            next(err);
        }
    },

    /** PUT /api/users/profile  (requires auth) */
    async updateProfile(req, res, next) {
        try {
            const updated = await userService.update(req.user.id, req.body);
            return res.status(200).json({ message: 'Profile updated', user: updated });
        } catch (err) {
            next(err);
        }
    },

    /** DELETE /api/users/:id  (requires auth) */
    async deleteUser(req, res, next) {
        try {
            await userService.delete(req.params.id);
            return res.status(200).json({ message: 'User deleted successfully' });
        } catch (err) {
            next(err);
        }
    },
};

module.exports = userController;
