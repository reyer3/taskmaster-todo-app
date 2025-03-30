/**
 * Pruebas unitarias para middleware de manejo de errores
 */
const { errorHandler } = require('../../../../src/infrastructure/middlewares/error.middleware');
const { AppError, ValidationError, AuthenticationError, AuthorizationError, NotFoundError } = require('../../../../src/utils/errors/app-error');
const { Prisma } = require('@prisma/client');

describe('Error Middleware', () => {
  // Objetos mock para req, res, next
  let req;
  let res;
  let next;
  let jsonSpy;
  let statusSpy;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock para el sistema de eventos
    const mockEventPublisher = {
      publish: jest.fn().mockResolvedValue()
    };
    
    // Setup objetos mock
    jsonSpy = jest.fn().mockReturnThis();
    statusSpy = jest.fn().mockReturnValue({ json: jsonSpy });
    
    req = {
      originalUrl: '/api/test',
      method: 'GET',
      events: {
        publisher: mockEventPublisher
      }
    };
    
    res = {
      status: statusSpy,
      json: jsonSpy
    };
    
    next = jest.fn();
    
    // Spy en console.error para evitar logs en tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restaurar console.error
    console.error.mockRestore();
  });

  describe('Manejo de errores de AppError', () => {
    it('debería manejar errores de AppError básicos', () => {
      // Crear error
      const error = new AppError('Error genérico de aplicación', 400);
      
      // Ejecutar middleware
      errorHandler(error, req, res, next);
      
      // Verificaciones
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({
        status: 'error',
        code: error.code,
        message: error.message
      }));
    });

    it('debería manejar ValidationError con errores de validación', () => {
      // Datos de prueba
      const validationErrors = {
        email: 'Email inválido',
        password: 'Contraseña requerida'
      };
      
      // Crear error
      const error = new ValidationError('Error de validación', validationErrors);
      
      // Ejecutar middleware
      errorHandler(error, req, res, next);
      
      // Verificaciones
      expect(statusSpy).toHaveBeenCalledWith(400); // ValidationError tiene statusCode 400
      expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({
        status: 'error',
        code: error.code,
        message: error.message,
        errors: validationErrors
      }));
    });

    it('debería manejar AuthenticationError', () => {
      // Crear error
      const error = new AuthenticationError('No autorizado');
      
      // Ejecutar middleware
      errorHandler(error, req, res, next);
      
      // Verificaciones
      expect(statusSpy).toHaveBeenCalledWith(401); // AuthenticationError tiene statusCode 401
      expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({
        status: 'error',
        code: error.code,
        message: error.message
      }));
    });

    it('debería manejar AuthorizationError', () => {
      // Crear error
      const error = new AuthorizationError('Acceso prohibido');
      
      // Ejecutar middleware
      errorHandler(error, req, res, next);
      
      // Verificaciones
      expect(statusSpy).toHaveBeenCalledWith(403); // AuthorizationError tiene statusCode 403
      expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({
        status: 'error',
        code: error.code,
        message: error.message
      }));
    });

    it('debería manejar NotFoundError', () => {
      // Crear error
      const error = new NotFoundError('Recurso no encontrado');
      
      // Ejecutar middleware
      errorHandler(error, req, res, next);
      
      // Verificaciones
      expect(statusSpy).toHaveBeenCalledWith(404); // NotFoundError tiene statusCode 404
      expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({
        status: 'error',
        code: error.code,
        message: error.message
      }));
    });
  });

  describe('Manejo de errores de Prisma', () => {
    it('debería manejar errores de restricción única (P2002)', () => {
      // Crear error de Prisma
      const error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint violation',
        {
          code: 'P2002',
          clientVersion: '5.9.1',
          meta: { target: ['email'] }
        }
      );
      
      // Ejecutar middleware
      errorHandler(error, req, res, next);
      
      // Verificaciones
      expect(statusSpy).toHaveBeenCalledWith(409); // Conflict
      expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({
        status: 'error',
        code: 'DB_CONFLICT_UNIQUE',
        message: expect.stringContaining('email')
      }));
    });

    it('debería manejar errores de record no encontrado (P2025)', () => {
      // Crear error de Prisma
      const error = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        {
          code: 'P2025',
          clientVersion: '5.9.1',
          meta: { cause: 'El registro solicitado no fue encontrado' }
        }
      );
      
      // Ejecutar middleware
      errorHandler(error, req, res, next);
      
      // Verificaciones
      expect(statusSpy).toHaveBeenCalledWith(404);
      expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({
        status: 'error',
        code: 'DB_NOT_FOUND',
        message: 'El registro solicitado no fue encontrado'
      }));
    });

    it('debería manejar errores de validación de Prisma', () => {
      // Crear error de Prisma
      const error = new Prisma.PrismaClientValidationError(
        'Error de validación en la base de datos'
      );
      
      // Ejecutar middleware
      errorHandler(error, req, res, next);
      
      // Verificaciones
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({
        status: 'error',
        code: 'DB_VALIDATION_ERROR'
      }));
    });
  });

  describe('Manejo de errores de JWT', () => {
    it('debería manejar errores de token inválido', () => {
      // Crear error de JWT
      const error = new Error('Token inválido');
      error.name = 'JsonWebTokenError';
      
      // Ejecutar middleware
      errorHandler(error, req, res, next);
      
      // Verificaciones
      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({
        status: 'error',
        code: 'INVALID_TOKEN',
        message: expect.stringContaining('Token inválido')
      }));
    });

    it('debería manejar errores de token expirado', () => {
      // Crear error de JWT
      const error = new Error('Token expirado');
      error.name = 'TokenExpiredError';
      
      // Ejecutar middleware
      errorHandler(error, req, res, next);
      
      // Verificaciones
      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({
        status: 'error',
        code: 'TOKEN_EXPIRED',
        message: expect.stringContaining('Token expirado')
      }));
    });
  });

  describe('Publicación de eventos de error', () => {
    it('debería publicar un evento de error al sistema de eventos', () => {
      // Crear error
      const error = new AppError('Error de prueba', 400);
      
      // Ejecutar middleware
      errorHandler(error, req, res, next);
      
      // Verificaciones
      expect(req.events.publisher.publish).toHaveBeenCalledWith(
        'system.error',
        expect.objectContaining({
          code: error.code,
          message: error.message,
          statusCode: 400,
          path: '/api/test',
          method: 'GET'
        })
      );
    });

    it('no debería fallar si el sistema de eventos no está disponible', () => {
      // Modificar req para que no tenga sistema de eventos
      req.events = null;
      
      // Crear error
      const error = new AppError('Error de prueba', 400);
      
      // Verificar que no lanza error
      expect(() => {
        errorHandler(error, req, res, next);
      }).not.toThrow();
      
      // Verificaciones
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalled();
    });
  });

  describe('Entorno de producción', () => {
    let originalNodeEnv;

    beforeEach(() => {
      // Guardar NODE_ENV original
      originalNodeEnv = process.env.NODE_ENV;
      // Establecer modo producción
      process.env.NODE_ENV = 'production';
    });

    afterEach(() => {
      // Restaurar NODE_ENV original
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('debería ocultar detalles de error en producción para errores 5xx', () => {
      // Crear error genérico (no AppError)
      const error = new Error('Error interno detallado');
      
      // Ejecutar middleware
      errorHandler(error, req, res, next);
      
      // Verificaciones
      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({
        status: 'error',
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Ocurrió un error inesperado en el servidor.'
      }));
    });

    it('debería mantener mensajes específicos para errores de AppError incluso en producción', () => {
      // Crear error de AppError
      const error = new NotFoundError('Usuario no encontrado');
      
      // Ejecutar middleware
      errorHandler(error, req, res, next);
      
      // Verificaciones
      expect(statusSpy).toHaveBeenCalledWith(404);
      expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({
        status: 'error',
        code: error.code,
        message: 'Usuario no encontrado'
      }));
    });
  });
});
