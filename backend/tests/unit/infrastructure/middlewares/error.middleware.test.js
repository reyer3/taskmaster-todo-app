/**
 * Pruebas unitarias para el middleware de manejo de errores
 *
 * @module tests/unit/infrastructure/middlewares/error.middleware.test
 */

// --- Dependencias ---
const httpMocks = require('node-mocks-http');
const { prodErrorHandler, devErrorHandler } = require('../../../../src/infrastructure/middlewares/error.middleware');
const {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError
} = require('../../../../src/utils/errors/app-error');

// --- Mocks ---

// Mock MEJORADO de PrismaClient: incluye el namespace 'Prisma' con errores simulados
jest.mock('@prisma/client', () => {
  // 1. Define las Clases de Error Simuladas
  class PrismaClientKnownRequestErrorMock extends Error {
    code; meta; clientVersion; batchRequestIdx;
    constructor(message, { code, clientVersion, meta, batchRequestIdx }) {
      super(message);
      this.code = code; this.clientVersion = clientVersion; this.meta = meta; this.batchRequestIdx = batchRequestIdx;
      this.name = 'PrismaClientKnownRequestError';
    }
    get [Symbol.toStringTag]() { return 'PrismaClientKnownRequestError'; }
  }

  class PrismaClientValidationErrorMock extends Error {
    clientVersion;
    constructor(message, { clientVersion }) {
      super(message); this.clientVersion = clientVersion;
      this.name = 'PrismaClientValidationError';
    }
    get [Symbol.toStringTag]() { return 'PrismaClientValidationError'; }
  }

  // AÑADE ESTAS DOS CLASES QUE TU MIDDLEWARE TAMBIÉN USA:
  class PrismaClientInitializationErrorMock extends Error {
    errorCode; clientVersion;
    constructor(message, { clientVersion, errorCode }) {
      super(message); this.clientVersion = clientVersion; this.errorCode = errorCode;
      this.name = 'PrismaClientInitializationError';
    }
    get [Symbol.toStringTag]() { return 'PrismaClientInitializationError'; }
  }
  class PrismaClientRustPanicErrorMock extends Error {
    clientVersion;
    constructor(message, { clientVersion }) {
      super(message); this.clientVersion = clientVersion;
      this.name = 'PrismaClientRustPanicError';
    }
    get [Symbol.toStringTag]() { return 'PrismaClientRustPanicError'; }
  }


  // 2. Mock del Constructor PrismaClient
  const mockPrismaClientInstance = {
    $connect: jest.fn().mockResolvedValue(undefined), $disconnect: jest.fn().mockResolvedValue(undefined),
    $on: jest.fn(), $use: jest.fn(),
    // ... mocks de modelos (task, user, etc.) ...
    task: { findMany: jest.fn().mockResolvedValue([]), findUnique: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue({}), update: jest.fn().mockResolvedValue({}), delete: jest.fn().mockResolvedValue({}), count: jest.fn().mockResolvedValue(0) },
    user: { findMany: jest.fn().mockResolvedValue([]), findUnique: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue({}), update: jest.fn().mockResolvedValue({}), delete: jest.fn().mockResolvedValue({}), count: jest.fn().mockResolvedValue(0) },
    notification: { findMany: jest.fn().mockResolvedValue([]), findUnique: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue({}), update: jest.fn().mockResolvedValue({}), delete: jest.fn().mockResolvedValue({}), count: jest.fn().mockResolvedValue(0) },
    notificationPreference: { findUnique: jest.fn().mockResolvedValue(null), upsert: jest.fn().mockResolvedValue({}) },
    $transaction: jest.fn(async (cb) => (typeof cb === 'function' ? cb(mockPrismaClientInstance) : Promise.resolve([]))),
  };
  const mockPrismaClientConstructor = jest.fn(() => mockPrismaClientInstance);


  // 3. Exporta el Objeto Mock Completo
  return {
    PrismaClient: mockPrismaClientConstructor, // Exporta el constructor
    // --- ¡¡Exporta el namespace 'Prisma' con TODAS las clases simuladas!! ---
    Prisma: {
      PrismaClientKnownRequestError: PrismaClientKnownRequestErrorMock,
      PrismaClientValidationError: PrismaClientValidationErrorMock,
      PrismaClientInitializationError: PrismaClientInitializationErrorMock, // <-- Añadida
      PrismaClientRustPanicError: PrismaClientRustPanicErrorMock,       // <-- Añadida
      // Añade otras si las simulaste y tu middleware las necesita
    }
  };
});

jest.mock('winston', () => {
  const mockLogger = { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() };
  return {
    createLogger: jest.fn(() => mockLogger),
    format: { combine: jest.fn(), timestamp: jest.fn(), printf: jest.fn(), colorize: jest.fn(), json: jest.fn() },
    transports: { Console: jest.fn(), File: jest.fn() }
  };
});

// --- Suite de Pruebas ---
describe('Error Middleware', () => {
  let req;
  let res;
  let next;
  let originalNodeEnv;

  beforeEach(() => {
    req = httpMocks.createRequest();
    res = httpMocks.createResponse();
    res.json = jest.fn();
    next = jest.fn();
    originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test'; // Por defecto en modo test
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv; // Restaura NODE_ENV
    jest.resetModules(); // Limpia caché de módulos
  });

  // --- Tests ---

  it('debería manejar AppError correctamente (incluyendo código)', () => {
    const error = new AppError('Test AppError message', 400, 'CUSTOM_CODE');
    prodErrorHandler(error, req, res, next);

    expect(res.statusCode).toBe(400);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Test AppError message',
      code: 'CUSTOM_CODE'
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('debería manejar ValidationError con código 400 (incluyendo código y errors)', () => {
    // Asumiendo que ValidationError puede tener un campo 'errors'
    const validationErrors = { field: 'is required' };
    const error = new ValidationError('Invalid input data', validationErrors);
    prodErrorHandler(error, req, res, next);

    expect(res.statusCode).toBe(400);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Invalid input data',
      code: 'VALIDATION_ERROR', // Código esperado para ValidationError
      errors: validationErrors // Incluye el campo 'errors' si tu middleware lo hace
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('debería manejar AuthenticationError con código 401 (incluyendo código)', () => {
    const error = new AuthenticationError('Credentials required');
    prodErrorHandler(error, req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Credentials required',
      code: 'AUTHENTICATION_ERROR' // Código esperado
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('debería manejar AuthorizationError con código 403 (incluyendo código)', () => {
    const error = new AuthorizationError('Permission denied');
    prodErrorHandler(error, req, res, next);

    expect(res.statusCode).toBe(403);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Permission denied',
      code: 'AUTHORIZATION_ERROR' // Código esperado
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('debería manejar NotFoundError con código 404 (incluyendo código)', () => {
    const error = new NotFoundError('Item not found');
    prodErrorHandler(error, req, res, next);

    expect(res.statusCode).toBe(404);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Item not found',
      code: 'NOT_FOUND' // Código esperado
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('debería manejar ConflictError con código 409 (incluyendo código)', () => {
    const error = new ConflictError('Duplicate entry');
    prodErrorHandler(error, req, res, next);

    expect(res.statusCode).toBe(409);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Duplicate entry',
      code: 'CONFLICT_ERROR' // Código esperado
    });
    expect(next).not.toHaveBeenCalled();
  });

  // --- Tests para Errores de Prisma (Ahora deberían funcionar) ---

  it('debería manejar error Prisma P2002 (unique constraint) con código 409', () => {
    // --- Arrange ---
    // Accede a Prisma a través del mock global (ya disponible por jest.mock)
    const { Prisma } = require('@prisma/client');

    // Creamos una instancia del error Prisma con todos los atributos necesarios
    const error = new Error('Unique constraint failed on the {constraint}');
    error.name = 'PrismaClientKnownRequestError';
    error.code = 'P2002';
    error.meta = { target: ['email'] };
    error.clientVersion = 'mockClientVersion';
    
    // Forzamos instanceof Prisma.PrismaClientKnownRequestError para que sea true
    // Reemplazamos el método instanceOf para que devuelva true para Prisma.PrismaClientKnownRequestError
    const originalInstanceOf = Object.prototype[Symbol.hasInstance];
    
    // Monkey-patch para el test
    Object.defineProperty(Prisma.PrismaClientKnownRequestError, Symbol.hasInstance, {
      value: function(instance) {
        return instance && instance.name === 'PrismaClientKnownRequestError';
      }
    });
    
    // --- Act ---
    prodErrorHandler(error, req, res, next);
    
    // Restaurar el método original
    if (originalInstanceOf) {
      Object.defineProperty(Prisma.PrismaClientKnownRequestError, Symbol.hasInstance, {
        value: originalInstanceOf
      });
    }

    // --- Assert ---
    expect(res.statusCode).toBe(409); // Ahora debería ser 409
    expect(res.json).toHaveBeenCalledTimes(1);
    const expectedMessage = `Ya existe un registro con los campos: ${error.meta.target.join(', ')}.`;
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: expectedMessage,
      code: 'DB_CONFLICT_UNIQUE'
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('debería manejar otros errores conocidos de Prisma con código 500', () => {
    const { Prisma } = require('@prisma/client');
    const error = new Prisma.PrismaClientKnownRequestError(
        'Some other known Prisma error',
        'P1001', // Otro código
        'mockClientVersion'
    );

    prodErrorHandler(error, req, res, next);

    expect(res.statusCode).toBe(500);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Ocurrió un error inesperado en el servidor.', // <-- Mensaje real
      code: 'INTERNAL_SERVER_ERROR' // <-- Código real
    });
    expect(next).not.toHaveBeenCalled();
  });

  // --- Tests para Errores Genéricos (Ahora deberían funcionar) ---

  it('debería manejar otros errores conocidos de Prisma con código 500', () => {
    const { PrismaClientKnownRequestError } = jest.requireMock('@prisma/client').Prisma;
    const error = new PrismaClientKnownRequestError(
        'Some other known Prisma error',
        { code: 'P1001', clientVersion: 'mockClientVersion' } // Usa el constructor correcto
    );
    prodErrorHandler(error, req, res, next);
    expect(res.statusCode).toBe(500);
    expect(res.json).toHaveBeenCalledWith({ // <-- CORREGIDO
      status: 'error',
      message: 'Ocurrió un error inesperado en el servidor.', // Mensaje real del middleware
      code: 'INTERNAL_SERVER_ERROR' // Código real del middleware para 500 genérico
    });
    expect(next).not.toHaveBeenCalled();
  });

// Test para errores genéricos (Línea ~252)
  it('debería manejar errores genéricos no reconocidos con código 500', () => {
    const error = new Error('Something unexpected happened');
    prodErrorHandler(error, req, res, next);
    expect(res.statusCode).toBe(500);
    expect(res.json).toHaveBeenCalledWith({ // <-- CORREGIDO
      status: 'error',
      message: 'Ocurrió un error inesperado en el servidor.', // Mensaje real del middleware
      code: 'INTERNAL_SERVER_ERROR' // Código real del middleware
    });
    expect(next).not.toHaveBeenCalled();
  });

  // --- Test para Modo Desarrollo (Ahora debería funcionar) ---

  it('debería incluir la pila de llamadas (stack trace) en modo desarrollo', () => {
    // Cambia a desarrollo para esta prueba
    process.env.NODE_ENV = 'development';

    const error = new Error('Error occurred in development');
    error.stack = 'Detailed error stack trace goes here...';

    devErrorHandler(error, req, res, next);

    expect(res.statusCode).toBe(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.objectContaining({
        message: 'Error occurred in development',
        stack: 'Detailed error stack trace goes here...'
      })
    }));
    expect(next).not.toHaveBeenCalled();
  });

  it('debería incluir el objeto completo de error en modo desarrollo', () => {
    // Forzar modo desarrollo durante esta prueba
    process.env.NODE_ENV = 'development';
    
    const error = new Error('Error interno detallado');
    error.stack = 'Stack trace simulado para prueba';
    
    devErrorHandler(error, req, res, next);
    
    expect(res.statusCode).toBe(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.objectContaining({
        message: 'Error interno detallado',
        stack: 'Stack trace simulado para prueba'
      })
    }));
  });

});