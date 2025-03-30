/**
 * Configuración global para las pruebas
 * Este archivo se carga antes de ejecutar los tests
 */

// Configuración de variables de entorno para testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/taskmaster_test';
process.env.ENABLE_WEBSOCKETS = 'false';
process.env.ENABLE_NOTIFICATIONS = 'false';

// Para evitar logs durante los tests
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  // Mantener errores y warnings para debugging
  error: console.error,
  warn: console.warn,
};

// Para que Jest espere a las promesas no resueltas
jest.setTimeout(10000);

// Limpiar todos los mocks después de cada test
afterEach(() => {
  jest.clearAllMocks();
});
