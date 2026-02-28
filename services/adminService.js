const crypto = require('crypto');
const User = require('../models/User');

/**
 * Normaliza un nombre completo a un slug de email.
 * "Dr. Juan García López" → "juan.garcia"
 * Toma las dos primeras palabras significativas (sin títulos).
 * @param {string} name
 * @returns {string}
 */
function nameToSlug(name) {
    const TITLES = /^(dr|dra|lic|ing|mtro|mtra)\.?$/i;

    const normalized = name
        .normalize('NFD')                   // descompone tildes
        .replace(/[\u0300-\u036f]/g, '')    // elimina diacríticos
        .toLowerCase()
        .replace(/[^a-z\s]/g, '')           // solo letras y espacios
        .trim();

    const words = normalized.split(/\s+/).filter(w => w && !TITLES.test(w));
    const [first = 'doctor', second = 'retiscan'] = words;
    return `${first}.${second}`;
}

/**
 * Genera una contraseña temporal segura de 12 caracteres alfanuméricos.
 * @returns {string}
 */
function generateTempPassword() {
    return crypto.randomBytes(9).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 12);
}

const adminService = {
    /**
     * Crea un médico con email @retiscan.com generado automáticamente.
     * Si el slug ya existe, añade un sufijo numérico (ej: juan.garcia2).
     * @param {string} name - Nombre completo del médico
     * @returns {{ user: object, tempPassword: string }}
     */
    async createDoctor(name) {
        const baseSlug = nameToSlug(name);
        let email = `${baseSlug}@retiscan.com`;

        // Resolver colisiones: juan.garcia → juan.garcia2 → juan.garcia3 ...
        let attempt = 1;
        while (await User.findByEmail(email)) {
            attempt++;
            email = `${baseSlug}${attempt}@retiscan.com`;
        }

        const tempPassword = generateTempPassword();
        const user = await User.create(email, name, tempPassword, 'MEDICO', true);

        return { user, tempPassword };
    },

    /**
     * Lista todos los usuarios con rol MEDICO.
     * @returns {object[]}
     */
    async listDoctors() {
        return User.findByRole('MEDICO');
    },

    /**
     * Elimina un médico por ID. Solo elimina si el usuario tiene rol MEDICO.
     * @param {string} id
     * @returns {object}
     */
    async deleteDoctor(id) {
        const user = await User.findById(id);
        if (!user) {
            const err = new Error('Doctor not found');
            err.statusCode = 404;
            throw err;
        }
        if (user.role !== 'MEDICO') {
            const err = new Error('User is not a doctor');
            err.statusCode = 400;
            throw err;
        }
        return User.deleteById(id);
    },
};

module.exports = adminService;
