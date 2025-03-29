/**
 * Router para Endpoints de Autenticación
 * Implementa todas las operaciones relacionadas con autenticación y perfil de usuario.
 */
const express = require('express');
const router = express.Router();

// --- Dependencias ---
const { AuthService } = require('../../services/auth.service');
const { UserRepository } = require('../../infrastructure/repositories/user.repository');
const { authMiddleware } = require('../../infrastructure/middlewares/auth.middleware');
const { ValidationError, AppError } = require('../../utils/errors/app-error');

// --- Instancias ---
const userRepository = new UserRepository();
const authService = new AuthService(userRepository);

// --- Validadores ---
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

const validateLogin = (req) => {
  const { email, password } = req.body;
  const errors = {};

  if (!email) errors.email = 'Email es requerido';
  if (!password) errors.password = 'Contraseña es requerida';

  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Error de validación', errors);
  }
};

// --- Endpoints ---

/**
 * @route POST /api/auth/register
 * @desc Registra un nuevo usuario
 * @access Público
 */
router.post('/register', async (req, res) => {
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
    user,
    accessToken,
    message: 'Usuario registrado exitosamente'
  });
});

/**
 * @route POST /api/auth/login
 * @desc Inicia sesión de usuario
 * @access Público
 */
router.post('/login', async (req, res) => {
  validateLogin(req);

  const { email, password } = req.body;
  const result = await authService.login(email, password);

  const { user, accessToken, refreshToken } = result;

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: 'strict'
  });

  res.json({
    user,
    accessToken,
    message: 'Inicio de sesión exitoso'
  });
});

/**
 * @route GET /api/auth/me
 * @desc Obtiene perfil del usuario autenticado
 * @access Privado
 */
router.get('/me', authMiddleware, async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new AppError('Usuario no autenticado correctamente', 401);
  }

  const user = await authService.getUserById(userId);
  res.json(user);
});

/**
 * @route PUT /api/auth/me
 * @desc Actualiza perfil del usuario
 * @access Privado
 */
router.put('/me', authMiddleware, async (req, res) => {
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
  res.json(updatedUser);
});

/**
 * @route POST /api/auth/change-password
 * @desc Cambia contraseña del usuario
 * @access Privado
 */
router.post('/change-password', authMiddleware, async (req, res) => {
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
  res.json({ success: true, message: 'Contraseña actualizada exitosamente' });
});

/**
 * @route POST /api/auth/refresh-token
 * @desc Renueva el token de acceso usando refresh token
 * @access Público (pero requiere refresh token válido)
 */
router.post('/refresh-token', async (req, res) => {
  // Obtener refresh token de cookies o del cuerpo de la solicitud
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!refreshToken) {
    throw new ValidationError('Refresh token es requerido');
  }

  const result = await authService.refreshToken(refreshToken);

  res.json({
    accessToken: result.accessToken,
    message: 'Token renovado exitosamente'
  });
});

/**
 * @route POST /api/auth/logout
 * @desc Cierra sesión del usuario
 * @access Privado
 */
router.post('/logout', authMiddleware, (req, res) => {
  // Limpiar la cookie de refresh token
  res.clearCookie('refreshToken');

  // En un sistema real, aquí también se debería invalidar el token en el backend
  // (añadirlo a una lista negra o similar)

  res.json({
    success: true,
    message: 'Sesión cerrada exitosamente'
  });
});

module.exports = router;