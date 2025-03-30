/**
 * Controlador para operaciones de autenticación y gestión de usuarios
 * 
 * Este módulo implementa la API REST para el registro, autenticación y
 * gestión de perfiles de usuario.
 * 
 * @module api/auth/auth.controller
 */
const express = require('express');
const router = express.Router();
const { AuthService } = require('../../services/auth.service');
const { UserRepository } = require('../../infrastructure/repositories/user.repository');
const { authMiddleware } = require('../../infrastructure/middlewares/auth.middleware');
const { ValidationError, AppError } = require('../../utils/errors/app-error');
const { convertToAppError } = require('../../utils/errors/error-converter');

// Crear instancias de repositorio y servicio
const userRepository = new UserRepository();
const authService = new AuthService(userRepository);

/**
 * Valida los datos de registro de un nuevo usuario
 * 
 * @param {import('express').Request} req - Objeto de solicitud Express
 * @throws {ValidationError} Si los datos son inválidos
 */
const validateRegistration = (req) => {
  const { email, password, name } = req.body;
  const errors = {};

  if (!email) errors.email = 'Email es requerido';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Email inválido';

  if (!password) errors.password = 'Contraseña es requerida';
  else if (password.length < 8) errors.password = 'La contraseña debe tener al menos 8 caracteres';

  if (!name) errors.name = 'Nombre es requerido';
  else if (name.trim().length < 2) errors.name = 'El nombre debe tener al menos 2 caracteres';

  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Error de validación', errors);
  }
};

/**
 * Valida los datos de inicio de sesión
 * 
 * @param {import('express').Request} req - Objeto de solicitud Express
 * @throws {ValidationError} Si los datos son inválidos
 */
const validateLogin = (req) => {
  const { email, password } = req.body;
  const errors = {};

  if (!email) errors.email = 'Email es requerido';
  if (!password) errors.password = 'Contraseña es requerida';

  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Error de validación', errors);
  }
};

/**
 * Registra un nuevo usuario
 * 
 * @route POST /api/auth/register
 * @param {import('express').Request} req - Objeto de solicitud Express
 * @param {import('express').Response} res - Objeto de respuesta Express
 * @param {import('express').NextFunction} next - Función next de Express
 * @returns {Promise<void>}
 */
router.post('/register', async (req, res, next) => {
  try {
    // Validación robusta de entrada
    validateRegistration(req);

    const { email, password, name } = req.body;
    const result = await authService.register({ email, password, name });

    // Separar la respuesta de autenticación (tokens) de los datos de usuario
    const { user, accessToken, refreshToken } = result;

    // Establecer refreshToken como cookie HTTP-only para mayor seguridad
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
      sameSite: 'strict'
    });

    res.status(201).json({
      status: 'success',
      data: {
        user,
        accessToken
      },
      message: 'Usuario registrado exitosamente'
    });
  } catch (error) {
    // Usar el sistema centralizado de manejo de errores
    next(convertToAppError(error));
  }
});

/**
 * Inicia sesión de usuario
 * 
 * @route POST /api/auth/login
 * @param {import('express').Request} req - Objeto de solicitud Express
 * @param {import('express').Response} res - Objeto de respuesta Express
 * @param {import('express').NextFunction} next - Función next de Express
 * @returns {Promise<void>}
 */
router.post('/login', async (req, res, next) => {
  try {
    // Validación de datos de entrada
    validateLogin(req);

    const { email, password } = req.body;
    const result = await authService.login(email, password);

    const { user, accessToken, refreshToken } = result;

    // Establecer refreshToken como cookie HTTP-only para mayor seguridad
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
      sameSite: 'strict'
    });

    res.json({
      status: 'success',
      data: {
        user,
        accessToken
      },
      message: 'Inicio de sesión exitoso'
    });
  } catch (error) {
    next(convertToAppError(error));
  }
});

/**
 * Obtiene el perfil del usuario autenticado
 * 
 * @route GET /api/auth/me
 * @param {import('express').Request} req - Objeto de solicitud Express
 * @param {import('express').Response} res - Objeto de respuesta Express
 * @param {import('express').NextFunction} next - Función next de Express
 * @returns {Promise<void>}
 */
router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('Usuario no autenticado correctamente', 401);
    }

    const user = await authService.getUserById(userId);

    res.json({
      status: 'success',
      data: user
    });
  } catch (error) {
    next(convertToAppError(error));
  }
});

/**
 * Actualiza el perfil de usuario
 * 
 * @route PUT /api/auth/me
 * @param {import('express').Request} req - Objeto de solicitud Express
 * @param {import('express').Response} res - Objeto de respuesta Express
 * @param {import('express').NextFunction} next - Función next de Express
 * @returns {Promise<void>}
 */
router.put('/me', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { name, email } = req.body;
    const updates = {};

    if (name !== undefined) {
      if (typeof name === 'string' && name.trim().length >= 2) {
        updates.name = name.trim();
      } else if (name !== null) {
        throw new ValidationError('El nombre debe tener al menos 2 caracteres');
      }
    }

    if (email !== undefined) {
      if (typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        updates.email = email.trim().toLowerCase();
      } else if (email !== null) {
        throw new ValidationError('Email inválido');
      }
    }

    if (Object.keys(updates).length === 0) {
      throw new ValidationError('Se requiere al menos un campo válido para actualizar');
    }

    const updatedUser = await authService.updateUser(userId, updates);

    res.json({
      status: 'success',
      data: updatedUser
    });
  } catch (error) {
    next(convertToAppError(error));
  }
});

/**
 * Cambia la contraseña del usuario
 * 
 * @route POST /api/auth/change-password
 * @param {import('express').Request} req - Objeto de solicitud Express
 * @param {import('express').Response} res - Objeto de respuesta Express
 * @param {import('express').NextFunction} next - Función next de Express
 * @returns {Promise<void>}
 */
router.post('/change-password', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword) {
      throw new ValidationError('La contraseña actual es requerida');
    }

    if (!newPassword) {
      throw new ValidationError('La nueva contraseña es requerida');
    }

    if (newPassword.length < 8) {
      throw new ValidationError('La nueva contraseña debe tener al menos 8 caracteres');
    }

    // Validación adicional de contraseña segura
    if (!/[A-Z]/.test(newPassword)) {
      throw new ValidationError('La contraseña debe contener al menos una letra mayúscula');
    }

    if (!/[0-9]/.test(newPassword)) {
      throw new ValidationError('La contraseña debe contener al menos un número');
    }

    await authService.changePassword(userId, currentPassword, newPassword);

    res.json({
      status: 'success',
      message: 'Contraseña cambiada correctamente'
    });
  } catch (error) {
    next(convertToAppError(error));
  }
});

/**
 * Renueva el token de acceso usando el token de refresco
 * 
 * @route POST /api/auth/refresh-token
 * @param {import('express').Request} req - Objeto de solicitud Express
 * @param {import('express').Response} res - Objeto de respuesta Express
 * @param {import('express').NextFunction} next - Función next de Express
 * @returns {Promise<void>}
 */
router.post('/refresh-token', async (req, res, next) => {
  try {
    // Obtener refresh token de cookies o del cuerpo de la solicitud
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      throw new ValidationError('Refresh token es requerido');
    }

    const result = await authService.refreshToken(refreshToken);

    res.json({
      status: 'success',
      data: {
        accessToken: result.accessToken
      },
      message: 'Token renovado exitosamente'
    });
  } catch (error) {
    next(convertToAppError(error));
  }
});

/**
 * Cierra la sesión del usuario
 * 
 * @route POST /api/auth/logout
 * @param {import('express').Request} req - Objeto de solicitud Express
 * @param {import('express').Response} res - Objeto de respuesta Express
 * @param {import('express').NextFunction} next - Función next de Express
 * @returns {void}
 */
router.post('/logout', authMiddleware, (req, res, next) => {
  try {
    // Limpiar la cookie de refresh token
    res.clearCookie('refreshToken');

    // En un sistema real, aquí también se debería invalidar el token en el backend
    // (añadirlo a una lista negra o similar)

    res.json({
      status: 'success',
      message: 'Sesión cerrada exitosamente'
    });
  } catch (error) {
    next(convertToAppError(error));
  }
});

module.exports = router;