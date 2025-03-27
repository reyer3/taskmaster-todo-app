/**
 * Middleware global para manejo de errores
 * 
 * Este middleware captura todos los errores lanzados en la aplicación
 * y los formatea de manera consistente antes de enviarlos al cliente
 */
const { AppError } = require('../../utils/errors/app-error');

/**
 * Middleware de manejo de errores
 */
function errorHandler(err, req, res, next) {
  console.error(`[ERROR] ${err.stack || err}`);

  // Errores personalizados de la aplicación
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      code: err.code,
      message: err.message,
      errors: err.errors || undefined,
    });
  }

  // Errores de Prisma
  if (err.name === 'PrismaClientKnownRequestError') {
    let message = 'Error en la base de datos';
    let statusCode = 500;

    // Manejar errores comunes de Prisma
    switch (err.code) {
      case 'P2002': // Unique constraint failed
        message = 'Ya existe un registro con estos datos';
        statusCode = 409;
        break;
      case 'P2025': // Record not found
        message = 'Registro no encontrado';
        statusCode = 404;
        break;
      default:
        break;
    }

    return res.status(statusCode).json({
      status: 'error',
      code: err.code,
      message,
    });
  }

  // Errores de validación de Express
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: 'Error de validación',
      errors: err.errors,
    });
  }

  // Error del servidor por defecto
  return res.status(500).json({
    status: 'error',
    code: 'INTERNAL_SERVER_ERROR',
    message: process.env.NODE_ENV === 'production' 
      ? 'Error interno del servidor' 
      : err.message,
  });
}

module.exports = { errorHandler };
