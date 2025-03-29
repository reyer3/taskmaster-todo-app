/**
 * Middleware global para manejo de errores en Express.
 */
const { Prisma } = require('@prisma/client');
const { AppError } = require('../../utils/errors/app-error');

// Determina el entorno una sola vez
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Middleware de manejo de errores centralizado.
 * @param {Error} err - El objeto de error capturado.
 * @param {import('express').Request} req - Objeto de solicitud de Express.
 * @param {import('express').Response} res - Objeto de respuesta de Express.
 * @param {Function} _next - Función 'next' de Express (no utilizada).
 */
function errorHandler(err, req, res, _next) {
  // 1. Logging detallado del error
  console.error(`[ERROR HANDLER] ${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  console.error(err.stack || err);

  // Valores predeterminados
  let statusCode = 500;
  const responseBody = {
    status: 'error',
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Ocurrió un error inesperado en el servidor.'
  };

  // 2. Manejo de Errores de AppError (jerarquía existente)
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    responseBody.code = err.code;
    responseBody.message = err.message;

    // Agregar errores de validación si existen
    if (err.errors) {
      responseBody.errors = err.errors;
    }
  }
  // 3. Manejo de Errores Conocidos de Prisma
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Acceder de forma segura a meta para resolver advertencias
    const meta = err.meta || {};

    switch (err.code) {
      case 'P2002': // Unique constraint violation
        statusCode = 409; // Conflict
        const targetFields = meta.target || ['campo desconocido'];
        responseBody.message = `Ya existe un registro con los campos: ${targetFields.join(', ')}.`;
        responseBody.code = 'DB_CONFLICT_UNIQUE';
        break;

      case 'P2014': // Required relation violation
        statusCode = 400; // Bad Request
        const relationInfo = [];
        if (meta.relation_name) relationInfo.push(`'${meta.relation_name}'`);
        if (meta.model_a_name && meta.model_b_name) {
          relationInfo.push(`entre '${meta.model_a_name}' y '${meta.model_b_name}'`);
        }

        responseBody.message = `La relación requerida ${relationInfo.join(' ')} se violaría.`;
        responseBody.code = 'DB_RELATION_VIOLATION';
        break;

      case 'P2025': // Record to update/delete not found
        statusCode = 404; // Not Found
        responseBody.message = meta.cause || 'El registro solicitado no fue encontrado.';
        responseBody.code = 'DB_NOT_FOUND';
        break;

      default:
        statusCode = 500;
        responseBody.message = 'Error en la base de datos.';
        responseBody.code = `DB_ERROR_${err.code}`;
        break;
    }
  }
  // 4. Manejo de Otros Errores de Prisma
  else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    responseBody.code = 'DB_VALIDATION_ERROR';
    responseBody.message = isProduction
        ? 'Error de validación en la base de datos.'
        : `Error de validación: ${err.message.split('\n').pop() || err.message}`;
  }
  else if (err instanceof Prisma.PrismaClientInitializationError) {
    statusCode = 503; // Service Unavailable
    responseBody.code = 'DB_CONNECTION_ERROR';
    responseBody.message = 'No se pudo conectar con la base de datos.';
  }
  else if (err instanceof Prisma.PrismaClientRustPanicError) {
    statusCode = 500;
    responseBody.code = 'DB_ENGINE_ERROR';
    responseBody.message = 'Error crítico en el motor de base de datos.';
  }
  // 5. Manejo de JWT y otros errores comunes
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    responseBody.code = 'INVALID_TOKEN';
    responseBody.message = 'Token inválido o malformado.';
  }
  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    responseBody.code = 'TOKEN_EXPIRED';
    responseBody.message = 'Token expirado.';
  }
  // 6. Errores HTTP estándar
  else if (err.statusCode) {
    statusCode = err.statusCode;
    responseBody.message = err.message;
    responseBody.code = err.code || `HTTP_ERROR_${statusCode}`;
  }

  // 7. Ocultar detalles sensibles en producción
  if (isProduction && statusCode >= 500 && !(err instanceof AppError)) {
    responseBody.message = 'Ocurrió un error inesperado en el servidor.';
    responseBody.code = 'INTERNAL_SERVER_ERROR';
  }

  // 8. Enviar la respuesta JSON estandarizada
  res.status(statusCode).json(responseBody);
}

module.exports = { errorHandler };