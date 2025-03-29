/**
 * Sistema escalable para manejo de errores sin dependencias excesivas
 *
 * Este enfoque utiliza Duck Typing y patrones en lugar de verificaciones de tipo,
 * evitando así dependencias directas con todos los módulos de dominio.
 */

// Importamos solo los errores de aplicación
const {
    AppError,
    ValidationError,
    NotFoundError,
    AuthenticationError,
    ConflictError
} = require('./app-error');

/**
 * Convertidor basado en patrones que no requiere importar todas las clases de errores
 * @param {Error} error - Cualquier error de cualquier fuente
 * @returns {AppError} Error convertido al formato de aplicación
 */
function convertToAppError(error) {
    // Si ya es un AppError, devolverlo tal cual
    if (error instanceof AppError) {
        return error;
    }

    // ESTRATEGIA 1: Conversión basada en el nombre de la clase
    const errorName = error.constructor.name;

    if (errorName === 'ValidationError' || errorName.includes('ValidationError')) {
        return new ValidationError(error.message, error.errors);
    }

    if (errorName === 'BusinessRuleViolationError' || errorName.includes('BusinessRule')) {
        // Detectar errores de autenticación por patrones en el mensaje
        if (error.message.toLowerCase().includes('contraseña') ||
            error.message.toLowerCase().includes('password') ||
            error.message.toLowerCase().includes('credencial')) {
            return new AuthenticationError(error.message);
        }

        // Error de regla de negocio genérico
        return new AppError(error.message, 422, 'BUSINESS_RULE_VIOLATION');
    }

    // ESTRATEGIA 2: Conversión basada en propiedades y códigos de Prisma

    // Errores específicos de Prisma
    if (error.code) {
        switch (error.code) {
            // Violación de unicidad
            case 'P2002':
                const targetFields = error.meta?.target || ['campo'];
                return new ConflictError(
                    `Ya existe un registro con los campos: ${targetFields.join(', ')}.`,
                    targetFields.join('_')
                );

            // Registro no encontrado
            case 'P2025':
                return new NotFoundError(
                    error.meta?.cause || 'El registro solicitado no fue encontrado.'
                );

            // Otros errores de Prisma
            default:
                if (error.code.startsWith('P')) {
                    return new AppError(
                        'Error en la base de datos.',
                        500,
                        `DB_ERROR_${error.code}`
                    );
                }
        }
    }

    // ESTRATEGIA 3: Conversión basada en nombre del error (JWT, etc.)

    // Errores de JWT
    if (error.name === 'JsonWebTokenError') {
        return new AuthenticationError('Token inválido.');
    }

    if (error.name === 'TokenExpiredError') {
        return new AuthenticationError('Token expirado.');
    }

    // ESTRATEGIA 4: Detección basada en mensajes

    // Detección de errores comunes por mensaje
    const message = error.message.toLowerCase();

    if (message.includes('no encontrado') || message.includes('not found')) {
        return new NotFoundError(error.message);
    }

    if (message.includes('ya existe') || message.includes('duplicado') ||
        message.includes('duplicate') || message.includes('already exists')) {
        return new ConflictError(error.message);
    }

    // ESTRATEGIA 5: Fallback - Para cualquier otro tipo de error

    return new AppError(
        error.message || 'Ocurrió un error inesperado.',
        error.statusCode || 500,
        error.code || 'INTERNAL_SERVER_ERROR'
    );
}

module.exports = { convertToAppError };