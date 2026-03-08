const User = require('../models/User');
const pool = require('../config/database');
const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Genera el payload del JWT incluyendo role y el nombre recuperado del perfil.
 */
function signToken(user, profileName) {
    const payload = {
        id: user.id,
        username: user.username,
        email: user.email || null,
        name: profileName || user.username,
        role: user.role,
        subscription_end_date: user.subscription_end_date || null,
    };
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

const authService = {
    /**
     * Login unificado: acepta email (médicos) o username (pacientes).
     */
    async login(identifier, password) {
        if (!identifier || !password) {
            const err = new Error('Se requieren identificador y contraseña');
            err.statusCode = 400;
            throw err;
        }

        const isEmail = identifier.includes('@');
        let user;

        if (isEmail) {
            user = await User.findByEmail(identifier);
        } else {
            user = await User.findByUsername(identifier);
        }

        if (!user) {
            const err = new Error('Credenciales inválidas');
            err.statusCode = 401;
            throw err;
        }

        const valid = await User.comparePassword(password, user.password_hash);
        if (!valid) {
            const err = new Error('Credenciales inválidas');
            err.statusCode = 401;
            throw err;
        }

        if (user.role === 'MEDICO' && !user.is_verified) {
            const err = new Error('Debes verificar tu correo electrónico antes de iniciar sesión.');
            err.statusCode = 403;
            throw err;
        }

        // Recuperar nombre y email desde la tabla de perfil correspondiente
        let profileName = null;
        let profileEmail = user.email;

        if (user.role === 'MEDICO') {
            const docRes = await pool.query(
                'SELECT first_name, paternal_surname, maternal_surname FROM doctors WHERE user_id = $1',
                [user.id]
            );
            if (docRes.rows[0]) {
                const d = docRes.rows[0];
                profileName = `${d.first_name} ${d.paternal_surname}${d.maternal_surname ? ' ' + d.maternal_surname : ''}`;
            }
        } else if (user.role === 'PACIENTE') {
            const patRes = await pool.query(
                'SELECT first_name, paternal_surname, maternal_surname, email FROM patients WHERE user_id = $1',
                [user.id]
            );
            if (patRes.rows[0]) {
                const p = patRes.rows[0];
                profileName = `${p.first_name} ${p.paternal_surname}${p.maternal_surname ? ' ' + p.maternal_surname : ''}`;
                profileEmail = p.email || user.email;
            }
        }

        const token = signToken({ ...user, email: profileEmail }, profileName);

        return {
            token,
            user: {
                id: user.id,
                username: user.username,
                email: profileEmail || undefined,
                name: profileName || user.username,
                role: user.role,
                is_verified: user.is_verified,
                mustChangePassword: user.must_change_password ?? false,
                subscription_end_date: user.subscription_end_date || null,
            },
        };
    },
};

module.exports = authService;
