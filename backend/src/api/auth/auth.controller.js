/**
 * Controlador para endpoints de autenticación
 */
const express = require('express');
const router = express.Router();
const { AuthService } = require('../../services/auth.service');
const { UserRepository } = require('../../infrastructure/repositories/user.repository');
const { authMiddleware } = require('../../infrastructure/middlewares/auth.middleware');
const { convertToAppError } = require('../../utils/errors/error-converter');

// Crear instancias de repositorio y servicio
const userRepository = new UserRepository();
const authService = new AuthService(userRepository);

/**
 * @route POST /auth/register
 * @description Registra un nuevo usuario
 */
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    // Validaciones básicas (estas podrían moverse a un middleware separado)
    if (!email || !password || !name) {
      return res.status(400).json({
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: 'Email, password y nombre son requeridos'
      });
    }

    const result = await authService.register({ email, password, name });

    res.status(201).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    // Usar el sistema centralizado de manejo de errores
    next(convertToAppError(error));
  }
});

/**
 * @route POST /auth/login
 * @description Inicia sesión de usuario
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validaciones básicas
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: 'Email y contraseña son requeridos'
      });
    }

    const result = await authService.login(email, password);

    res.json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(convertToAppError(error));
  }
});

/**
 * @route GET /auth/me
 * @description Obtiene el perfil del usuario autenticado
 */
router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const user = await authService.getUserById(req.user.id);

    res.json({
      status: 'success',
      data: user
    });
  } catch (error) {
    next(convertToAppError(error));
  }
});

/**
 * @route PUT /auth/me
 * @description Actualiza el perfil de usuario
 */
router.put('/me', authMiddleware, async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (email) updates.email = email;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: 'Se requiere al menos un campo para actualizar'
      });
    }

    const user = await authService.updateUser(req.user.id, updates);

    res.json({
      status: 'success',
      data: user
    });
  } catch (error) {
    next(convertToAppError(error));
  }
});

/**
 * @route POST /auth/change-password
 * @description Cambia la contraseña del usuario
 */
router.post('/change-password', authMiddleware, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: 'Se requiere la contraseña actual y la nueva'
      });
    }

    await authService.changePassword(req.user.id, currentPassword, newPassword);

    res.json({
      status: 'success',
      message: 'Contraseña cambiada correctamente'
    });
  } catch (error) {
    next(convertToAppError(error));
  }
});

/**
 * @route POST /auth/refresh-token
 * @description Renueva el token de acceso usando el token de refresco
 */
router.post('/refresh-token', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: 'Token de refresco requerido'
      });
    }

    const result = await authService.refreshToken(refreshToken);

    res.json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(convertToAppError(error));
  }
});

module.exports = router;