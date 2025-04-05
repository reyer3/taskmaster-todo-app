/**
 * Pruebas unitarias para el middleware de logging
 * 
 * @module tests/unit/infrastructure/middlewares/logger.middleware.test
 */
const { describe, it, beforeEach, afterEach, expect } = require('@jest/globals');
const httpMocks = require('node-mocks-http');

// Mockear console para capturar las llamadas
const originalConsole = global.console;

beforeEach(() => {
  // Configurar mocks para console
  global.console = {
    ...originalConsole,
    log: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn()
  };
});

afterEach(() => {
  // Restaurar console original
  global.console = originalConsole;
});

// Ahora importamos el sistema bajo prueba
const { requestLogger } = require('../../../../src/infrastructure/middlewares/logger.middleware');

describe('Logger Middleware', () => {
  let req, res, next;
  
  beforeEach(() => {
    jest.clearAllMocks();
    req = httpMocks.createRequest({
      method: 'GET',
      url: '/api/tasks',
      headers: {
        'x-forwarded-for': '192.168.1.1',
        'user-agent': 'Test User Agent'
      }
    });
    res = httpMocks.createResponse();
    next = jest.fn();
  });
  
  describe('requestLogger', () => {
    it('debería registrar detalles de solicitud entrante', () => {
      // Ejecutar middleware
      requestLogger(req, res, next);
      
      // Verificar logging
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('[REQUEST]')
      );
      
      // Verificar que se llamó a next
      expect(next).toHaveBeenCalled();
    });
    
    it('debería manejar ausencia de headers', () => {
      // Crear request sin headers completos
      req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/health'
      });
      
      // Ejecutar middleware
      requestLogger(req, res, next);
      
      // Verificar logging
      expect(console.log).toHaveBeenCalled();
      
      // Verificar que se llamó a next
      expect(next).toHaveBeenCalled();
    });
    
    it('debería asignar un requestId único para cada solicitud', () => {
      // Ejecutar middleware múltiples veces
      const requests = [];
      for (let i = 0; i < 3; i++) {
        const newReq = httpMocks.createRequest();
        const newRes = httpMocks.createResponse();
        requestLogger(newReq, newRes, jest.fn());
        requests.push(newReq);
      }
      
      // Verificar que cada request tiene un ID
      expect(requests[0].requestId).toBeDefined();
      expect(requests[1].requestId).toBeDefined();
      expect(requests[2].requestId).toBeDefined();
      
      // Verificar que los IDs son diferentes
      expect(requests[0].requestId).not.toEqual(requests[1].requestId);
      expect(requests[1].requestId).not.toEqual(requests[2].requestId);
      expect(requests[0].requestId).not.toEqual(requests[2].requestId);
    });
    
    it('debería medir el tiempo de respuesta', () => {
      // Ejecutar middleware
      requestLogger(req, res, next);
      
      // Verificar que se modifica el método send
      expect(res.send).not.toEqual(httpMocks.createResponse().send);
      
      // Simular una respuesta enviada
      res.send('Test response');
      
      // Verificar log de fin de solicitud
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('[RESPONSE]')
      );
    });
  });
});
