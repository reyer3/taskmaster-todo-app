/**
 * Clase base para todos los errores personalizados de la aplicación
 * 
 * Esta clase extiende Error y proporciona funcionalidad adicional
 * para manejar errores de forma consistente en toda la aplicación.
 */
class AppError extends Error {
  /**
   * Constructor para errores de aplicación
   * 
   * @param {string} message - Mensaje descriptivo del error
   * @param {number} statusCode - Código HTTP para la respuesta
   * @param {string} code - Código interno del error
   * @param {Object} errors - Errores adicionales (para validación)
   */
  constructor(message, statusCode = 500, code = 'SERVER_ERROR', errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
    this.isOperational = true; // Indica que es un error operacional conocido

    // Captura la pila de llamadas
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error para recursos no encontrados
 */
class NotFoundError extends AppError {
  constructor(message = 'Recurso no encontrado', resource = 'recurso') {
    super(message, 404, 'NOT_FOUND');
    this.resource = resource;
  }
}

/**
 * Error para problemas de autenticación
 */
class AuthenticationError extends AppError {
  constructor(message = 'Error de autenticación') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

/**
 * Error para problemas de autorización
 */
class AuthorizationError extends AppError {
  constructor(message = 'No tienes permisos para realizar esta acción') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

/**
 * Error para problemas de validación
 */
class ValidationError extends AppError {
  constructor(message = 'Error de validación', errors = {}) {
    super(message, 400, 'VALIDATION_ERROR', errors);
  }
}

/**
 * Error para conflictos (ej: recurso ya existe)
 */
class ConflictError extends AppError {
  constructor(message = 'El recurso ya existe', resource = 'recurso') {
    super(message, 409, 'CONFLICT_ERROR');
    this.resource = resource;
  }
}

module.exports = {
  AppError,
  NotFoundError,
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  ConflictError
};
