const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

/**
 * Genera un token JWT para pruebas
 * @param {Object} userData - Datos del usuario para incluir en el token
 * @returns {string} Token JWT firmado
 */
function generateTestToken(userData) {
  const secretKey = process.env.JWT_SECRET || 'test-jwt-secret';
  return jwt.sign(userData, secretKey, { expiresIn: '1h' });
}

/**
 * Crea un entorno de prueba Express con configuraciones predeterminadas
 * @param {Object} options - Opciones de configuración del entorno de prueba
 * @returns {Object} Objeto con aplicación Express y utilidades de configuración
 */
function createTestEnvironment(options = {}) {
  const app = express();

  // Configuraciones predeterminadas
  const defaultConfig = {
    userId: 'user-123',
    userEmail: 'test@example.com',
    authMiddleware: null
  };

  const config = { ...defaultConfig, ...options };

  // Middleware de autenticación por defecto
  const defaultAuthMiddleware = (req, res, next) => {
    req.user = {
      id: config.userId,
      email: config.userEmail
    };
    next();
  };

  // Usar middleware de autenticación personalizado o por defecto
  const authMiddleware = config.authMiddleware || defaultAuthMiddleware;

  // Configurar middlewares básicos
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  // Configurar mocks de componentes globales
  const mockComponents = {
    websockets: { 
      socketServer: jest.fn() 
    },
    events: { 
      publisher: {
        publish: jest.fn().mockResolvedValue(true)
      }
    }
  };

  app.set('components', mockComponents);

  /**
   * Crear mock de servicio genérico para pruebas
   * @param {Object} methods - Métodos personalizados para el mock
   * @returns {Object} Mock de servicio con métodos predefinidos
   */
  function createMockService(methods = {}) {
    const baseMethods = {
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      list: jest.fn()
    };

    return { ...baseMethods, ...methods };
  }

  /**
   * Registrar rutas con middleware de autenticación
   * @param {express.Router} router - Enrutador a registrar
   */
  function registerAuthenticatedRoutes(router) {
    app.use('/api', authMiddleware, router);
  }

  /**
   * Generar datos de prueba con opciones de personalización
   * @param {string} type - Tipo de datos a generar
   * @param {Object} overrides - Sobrescribir propiedades generadas
   * @returns {Object} Datos de prueba generados
   */
  function generateTestData(type, overrides = {}) {
    const testDataGenerators = {
      notification: () => ({
        id: `notification-${Math.random().toString(36).substr(2, 9)}`,
        userId: config.userId,
        type: 'system.test',
        title: 'Notificación de prueba',
        message: 'Mensaje de prueba',
        isRead: false,
        createdAt: new Date().toISOString(),
        ...overrides
      }),
      user: () => ({
        id: config.userId,
        email: config.userEmail,
        ...overrides
      }),
      preferences: () => ({
        userId: config.userId,
        emailEnabled: true,
        pushEnabled: true,
        ...overrides
      })
    };

    return testDataGenerators[type] ? testDataGenerators[type]() : {};
  }

  return {
    app,
    mockComponents,
    createMockService,
    registerAuthenticatedRoutes,
    generateTestData,
    config
  };
}

module.exports = {
  createTestEnvironment,
  generateTestToken
};
