const { body, validationResult } = require('express-validator');

/**
 * Middleware para validar el registro de médicos.
 * Intercepta los datos antes de crear el usuario, evitando errores 
 * de la base de datos (como "value too long for type character varying").
 */
const validateMedicalRegistration = [
    body('firstName')
        .notEmpty().withMessage('El nombre es obligatorio.')
        .isLength({ max: 100 }).withMessage('El nombre no puede tener más de 100 caracteres.'),
    
    body('paternalSurname')
        .notEmpty().withMessage('El apellido paterno es obligatorio.')
        .isLength({ max: 100 }).withMessage('El apellido paterno no puede tener más de 100 caracteres.'),

    body('email')
        .notEmpty().withMessage('El correo electrónico es obligatorio.')
        .isEmail().withMessage('El formato del correo no es válido.')
        .isLength({ max: 255 }).withMessage('El correo es demasiado largo.'),

    body('password')
        .notEmpty().withMessage('La contraseña es obligatoria.')
        .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres.'),

    body('licenseNumber')
        .notEmpty().withMessage('La cédula profesional es obligatoria.')
        .isNumeric().withMessage('La cédula profesional solo debe contener números.')
        .isLength({ max: 30 }).withMessage('La cédula no puede tener más de 30 caracteres.'),

    body('phone')
        .optional({ checkFalsy: true })
        .isLength({ max: 20 }).withMessage('El teléfono no puede tener más de 20 caracteres.'),

    // Middleware para checar los resultados de express-validator
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // Retorna un error amigable enfocado en la interfaz
            return res.status(400).json({ error: errors.array()[0].msg });
        }
        next();
    }
];

module.exports = {
    validateMedicalRegistration
};
