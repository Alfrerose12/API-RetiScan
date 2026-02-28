const { Router } = require('express');
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = Router();

// ─────────────────────────────────────────────
// Public routes
// ─────────────────────────────────────────────

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Gestión de usuarios y autenticación
 */

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Registrar un nuevo usuario
 *     description: |
 *       El rol se asigna automáticamente según el dominio del email:
 *       - `@retiscan.com` → **MEDICO**
 *       - `@yada.com` → **ADMINISTRADOR**
 *       - Cualquier otro dominio → **PACIENTE**
 *     tags: [Users]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 user:    { $ref: '#/components/schemas/User' }
 *       400:
 *         description: Campos requeridos faltantes
 *       409:
 *         description: Email ya registrado
 */
router.post('/register', userController.register);

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: Iniciar sesión y obtener token JWT
 *     tags: [Users]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login exitoso — incluye token JWT
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Campos requeridos faltantes
 *       401:
 *         description: Credenciales inválidas
 */
router.post('/login', userController.login);

// ─────────────────────────────────────────────
// Protected routes
// ─────────────────────────────────────────────

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Obtener perfil del usuario autenticado
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user: { $ref: '#/components/schemas/User' }
 *       401:
 *         description: Token inválido o faltante
 */
router.get('/profile', authMiddleware, userController.getProfile);

/**
 * @swagger
 * /users/profile:
 *   put:
 *     summary: Actualizar perfil del usuario autenticado
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:    { type: string, format: email }
 *               password: { type: string, minLength: 6 }
 *               role:     { type: string, enum: [MEDICO, PACIENTE, ADMINISTRADOR] }
 *     responses:
 *       200:
 *         description: Perfil actualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 user:    { $ref: '#/components/schemas/User' }
 *       401:
 *         description: Token inválido o faltante
 *       404:
 *         description: Usuario no encontrado
 */
router.put('/profile', authMiddleware, userController.updateProfile);

/**
 * @swagger
 * /users/change-password:
 *   put:
 *     summary: Cambiar contraseña del usuario autenticado
 *     description: |
 *       Permite al usuario cambiar su contraseña. Si el usuario tiene
 *       `mustChangePassword: true` (médico con contraseña temporal), este
 *       endpoint la elimina y desactiva la bandera.
 *
 *       La PWA debe redirigir al médico a esta pantalla si `mustChangePassword` es `true` en el login.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [newPassword]
 *             properties:
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 example: MiNuevaPassword123
 *     responses:
 *       200:
 *         description: Contraseña actualizada — mustChangePassword ahora es false
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Contraseña actualizada exitosamente
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: newPassword faltante o menor a 6 caracteres
 *       401:
 *         description: Token inválido o faltante
 */
router.put('/change-password', authMiddleware, userController.changePassword);

router.delete('/:id', authMiddleware, userController.deleteUser);

module.exports = router;
