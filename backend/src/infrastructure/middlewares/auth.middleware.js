/**
 * Middleware para autenticación y protección de rutas
 */
const { AuthService } = require('../../services/auth.service');
const { UserRepository } = require('../repositories/user.repository');
const { convertToAppError } = require('../../utils/errors/error-converter');
const { AuthenticationError, AuthorizationError } = require('../../utils/errors/app-error');

// Inicializar servicios necesarios
const userRepository = new UserRepository();
const authService = new AuthService(userRepository);

const jwt = require('jsonwebtoken');

/**
 * Middleware que verifica la autenticación mediante token JWT
 */
const authMiddleware = async (req, res, next) => {
  // Obtener token del header Authorization
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AuthenticationError('No se proporcionó token de autenticación'));
  }

  // Extraer el token
  const token = authHeader.split(' ')[1];

  try {
    // Verificar el token usando el servicio de autenticación
    req.user = await authService.verifyToken(token);
    
    // Si todo está bien, continuar con la solicitud
    next();
  } catch (error) {
    // Convertir el error a un error de aplicación y pasarlo al siguiente middleware
    next(convertToAppError(error));
  }
};

/**
 * Middleware que verifica si el usuario tiene rol de administrador
 */
const adminMiddleware = (req, res, next) => {
  // El authMiddleware debe ejecutarse primero
  if (!req.user) {
    // Crear error directamente sin try-catch innecesario
    return next(new AuthenticationError('Se requiere autenticación'));
  }

  if (req.user.role !== 'admin') {
    // Crear error directamente sin try-catch innecesario
    return next(new AuthorizationError('Se requieren privilegios de administrador'));
  }

  // Si todo está bien, continuar
  next();
};

module.exports = {
  authMiddleware,
  adminMiddleware
};