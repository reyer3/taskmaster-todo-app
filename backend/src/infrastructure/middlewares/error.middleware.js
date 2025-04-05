/**
 * Middleware global para manejo de errores en Express.
 */
const { Prisma } = require('@prisma/client');
const { AppError } = require('../../utils/errors/app-error');
const { eventTypes } = require('../events');
const { SystemEvents } = eventTypes;

// Determina el entorno una sola vez
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

/**
 * Manejador de errores para producción
 * Maneja distintos tipos de error y genera respuestas apropiadas
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
  else if (
    err instanceof Prisma.PrismaClientKnownRequestError || 
    (err.name === 'PrismaClientKnownRequestError' && err.code && err.meta)) {
    // Acceder de forma segura a meta para resolver advertencias
    const meta = err.meta || {};

    switch (err.code) {
      case 'P2002': // Unique constraint violation
        statusCode = 409; // Conflict
        const targetFields = Array.isArray(meta.target) ? meta.target : ['campo desconocido'];
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
  else if (
    err instanceof Prisma.PrismaClientValidationError || 
    err.name === 'PrismaClientValidationError') {
    statusCode = 400;
    responseBody.code = 'DB_VALIDATION_ERROR';
    responseBody.message = isProduction
        ? 'Error de validación en la base de datos.'
        : `Error de validación: ${err.message.split('\n').pop() || err.message}`;
  }
  else if (
    err instanceof Prisma.PrismaClientInitializationError || 
    err.name === 'PrismaClientInitializationError') {
    statusCode = 503; // Service Unavailable
    responseBody.code = 'DB_CONNECTION_ERROR';
    responseBody.message = 'No se pudo conectar con la base de datos.';
  }
  else if (
    err instanceof Prisma.PrismaClientRustPanicError || 
    err.name === 'PrismaClientRustPanicError') {
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
  if ((isProduction || isTest) && statusCode >= 500 && !(err instanceof AppError)) {
    responseBody.message = 'Ocurrió un error inesperado en el servidor.';
    responseBody.code = 'INTERNAL_SERVER_ERROR';
  }

  // 7.1 Mostrar información detallada en desarrollo
  if (isDevelopment && statusCode >= 500) {
    responseBody.stack = err.stack || 'Detailed error stack trace goes here...';
  }

  // 8. Publicar el error como evento si está disponible el sistema de eventos
  if (req.events && req.events.publisher) {
    const eventPayload = {
      code: responseBody.code,
      message: responseBody.message,
      statusCode,
      path: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString(),
      userId: req.user?.id
    };

    req.events.publisher.publish(SystemEvents.SYSTEM_ERROR, eventPayload);
  }

  // 9. Enviar la respuesta JSON estandarizada
  res.status(statusCode).json(responseBody);
}

/**
 * Manejador de errores para desarrollo
 * Incluye información detallada para facilitar la depuración
 */
function devErrorHandler(err, req, res, _next) {
  console.error(`[DEV ERROR HANDLER] ${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  console.error(err.stack || "Detailed error stack trace goes here...");
  
  // Configurar respuesta para desarrollo
  const statusCode = err.statusCode || 500;
  
  // Respuesta con todos los detalles para desarrollo
  const responseBody = {
    error: {
      message: err.message,
      name: err.name,
      stack: err.stack,
      code: err.code || 'INTERNAL_SERVER_ERROR'
    },
    request: {
      url: req.originalUrl,
      method: req.method,
      query: req.query,
      params: req.params,
      body: req.body
    }
  };
  
  res.status(statusCode).json(responseBody);
}

/**
 * Exporta el manejador de errores según el entorno
 * En producción, usamos el manejador sin detalles
 * En desarrollo, usamos el manejador con detalles completos 
 * En pruebas, usamos el manejador sin detalles (como en producción)
 */
// Siempre usar el manejador de producción en pruebas
module.exports.errorHandler = (isProduction || isTest) ? errorHandler : devErrorHandler;
module.exports.devErrorHandler = devErrorHandler;
module.exports.prodErrorHandler = errorHandler;