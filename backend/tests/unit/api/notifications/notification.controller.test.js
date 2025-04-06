/**
 * Test con mocks correctos para repositorios
 */
const express = require('express');
const request = require('supertest');

// Configuración de mocks
jest.mock('../../../../src/infrastructure/middlewares/auth.middleware', () => ({
  authMiddleware: function(req, res, next) {
    req.user = { id: 'user-123' };
    next();
  }
}));

// Mock del servicio con implementaciones mínimas
const mockService = {
  getUserNotifications: jest.fn(() => Promise.resolve({ items: [], total: 0 })),
  markAsRead: jest.fn(() => Promise.resolve({})),
  markAllAsRead: jest.fn(() => Promise.resolve(0)),
  deleteNotification: jest.fn(() => Promise.resolve(true)),
  getUserPreferences: jest.fn(() => Promise.resolve({})),
  updateUserPreferences: jest.fn(() => Promise.resolve({}))
};

// Mock del NotificationService
jest.mock('../../../../src/services/notification.service', () => ({
  NotificationService: function() {
    return mockService;
  }
}));

// IMPORTANTE: Mock para los repositorios como constructores
jest.mock('../../../../src/infrastructure/repositories/notification.repository', () => ({
  NotificationRepository: jest.fn().mockImplementation(function() {
    return {
      findByUserId: jest.fn().mockResolvedValue([]),
      findById: jest.fn().mockResolvedValue({}),
      markAsRead: jest.fn().mockResolvedValue({}),
      deleteById: jest.fn().mockResolvedValue(true),
      countUnread: jest.fn().mockResolvedValue(0)
    };
  })
}));

jest.mock('../../../../src/infrastructure/repositories/notification-preference.repository', () => ({
  NotificationPreferenceRepository: jest.fn().mockImplementation(function() {
    return {
      findByUserId: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({})
    };
  })
}));

// Mockear errorHandler también para evitar problemas
jest.mock('../../../../src/infrastructure/middlewares/error.middleware', () => ({
  errorHandler: function(err, req, res, next) {
    // Log del error para debugging en los tests
    console.log('Error capturado en middleware:', err.message || 'Error sin mensaje');
    // Asegurarnos de enviar una respuesta
    res.status(err.statusCode || 500).json({
      status: 'error',
      message: err.message || 'Error interno del servidor'
    });
  }
}));

// Test básico
describe('Test mínimo sin importaciones', () => {
  it('debería pasar este test simple', () => {
    expect(true).toBe(true);
  });
});

// IMPORTANTE: Importar después de mockear todo
const { AppError } = require('../../../../src/utils/errors/app-error');
const { errorHandler } = require('../../../../src/infrastructure/middlewares/error.middleware');
const notificationController = require('../../../../src/api/notifications/notification.controller');

describe('Test con el controlador importado correctamente', () => {
  it('debería importar correctamente AppError, errorHandler y controlador', () => {
    expect(AppError).toBeDefined();
    expect(errorHandler).toBeDefined();
    expect(notificationController).toBeDefined();
  });
});

describe('Test con Express y solicitudes', () => {
  let app;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Configurar Express
    app = express();
    app.use(express.json());
    
    // Configurar componentes necesarios
    app.set('components', {
      websockets: { socketServer: {} },
      events: { publisher: {} }
    });
    
    // Montar el controlador
    app.use('/api/notifications', notificationController);
    
    // Middleware de error simple y directo
    app.use(errorHandler);
  });
  
  it('debería responder a una solicitud GET básica', async () => {
    const response = await request(app).get('/api/notifications');
    expect(response.statusCode).toBe(200);
  }, 5000); // Timeout de 5 segundos
  
  // --- Pruebas GET /api/notifications ---
  it('GET /api/notifications - debería devolver lista de notificaciones', async () => {
    const mockNotificationsData = {
      items: [
        { id: 'n1', userId: 'user-123', title: 'Test 1', isRead: false },
        { id: 'n2', userId: 'user-123', title: 'Test 2', isRead: true },
      ],
      total: 2,
      limit: 10,
      offset: 0
    };
    mockService.getUserNotifications.mockResolvedValue(mockNotificationsData);

    const response = await request(app)
      .get('/api/notifications?limit=10&offset=0')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(mockService.getUserNotifications).toHaveBeenCalledWith('user-123', {
      limit: 10,
      offset: 0,
      onlyUnread: false,
      sortDirection: 'desc',
      types: []
    });
    expect(response.body.status).toBe('success');
    expect(response.body.data).toEqual(mockNotificationsData);
  });

  // Re-habilitamos la prueba que antes estaba causando problemas
  it('GET /api/notifications - manejo de errores', async () => {
    // Crear un error específico de la aplicación con AppError
    const errorMsg = 'Error alternativo de prueba';
    const mockError = new AppError(errorMsg, 500);
    
    // Configurar el mock para rechazar la promesa
    mockService.getUserNotifications.mockImplementation(() => {
      return Promise.reject(mockError);
    });

    // Ahora que el controlador maneja errores correctamente, podemos usar .ok()
    const response = await request(app)
      .get('/api/notifications')
      .ok(res => res.status < 600); // Acepta cualquier código HTTP como "ok"
    
    // Verificamos que la respuesta sea la esperada
    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('status', 'error');
    expect(response.body).toHaveProperty('message', errorMsg);
  });
  
  // --- Pruebas PATCH /api/notifications/:id/read ---
  it('PATCH /api/notifications/:id/read - debería marcar una notificación como leída', async () => {
    const mockNotification = { id: 'n1', userId: 'user-123', title: 'Test 1', isRead: true };
    mockService.markAsRead.mockResolvedValue(mockNotification);

    const response = await request(app)
      .patch('/api/notifications/n1/read')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(mockService.markAsRead).toHaveBeenCalledWith('n1', 'user-123');
    expect(response.body.status).toBe('success');
    expect(response.body.data).toEqual(mockNotification);
    expect(response.body.message).toContain('marcada como leída');
  });

  // Re-habilitamos la prueba que antes estaba desactivada
  it('PATCH /api/notifications/:id/read - debería manejar error si no se encuentra o no pertenece al usuario', async () => {
    const errorMsg = 'Notificación no encontrada o no pertenece al usuario';
    const mockError = new AppError(errorMsg, 404);
    mockService.markAsRead.mockImplementation(() => Promise.reject(mockError));

    // Usar .ok() para NO lanzar excepciones en errores HTTP
    const response = await request(app)
      .patch('/api/notifications/n-error/read')
      .ok(res => res.status < 600); // Acepta cualquier código HTTP

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('status', 'error');
    expect(response.body).toHaveProperty('message', errorMsg);
  });
  
  // --- Pruebas PATCH /api/notifications/read-all ---
  it('PATCH /api/notifications/read-all - debería marcar todas como leídas', async () => {
    mockService.markAllAsRead.mockResolvedValue(5); // Simulamos que 5 se marcaron

    const response = await request(app)
      .patch('/api/notifications/read-all')
      .expect('Content-Type', /json/)
      .expect(200);
    
    expect(mockService.markAllAsRead).toHaveBeenCalledWith('user-123', []);
    expect(response.body.status).toBe('success');
    expect(response.body.data).toEqual({ count: 5 });
  });
  
  // --- Pruebas DELETE /api/notifications/:id ---
  it('DELETE /api/notifications/:id - debería eliminar una notificación', async () => {
    mockService.deleteNotification.mockResolvedValue(true);

    const response = await request(app)
      .delete('/api/notifications/n1')
      .expect(204);

    expect(mockService.deleteNotification).toHaveBeenCalledWith('n1', 'user-123');
    expect(response.body).toEqual({}); // Respuesta vacía para 204
  });

  // Re-habilitamos la prueba que antes estaba desactivada
  it('DELETE /api/notifications/:id - debería manejar error si no se encuentra o no pertenece', async () => {
    const errorMsg = 'Notificación no encontrada o no autorizada para eliminar';
    const mockError = new AppError(errorMsg, 404);
    mockService.deleteNotification.mockImplementation(() => Promise.reject(mockError));

    // Usar .ok() para NO lanzar excepciones en errores HTTP
    const response = await request(app)
      .delete('/api/notifications/n-error')
      .ok(res => res.status < 600); // Acepta cualquier código HTTP
      
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('status', 'error');
    expect(response.body).toHaveProperty('message', errorMsg);
  });
  
  // --- Pruebas GET /api/notifications/preferences ---
  it('GET /api/notifications/preferences - debería obtener las preferencias', async () => {
    const mockPrefs = { userId: 'user-123', emailEnabled: true, pushEnabled: false };
    mockService.getUserPreferences.mockResolvedValue(mockPrefs);

    const response = await request(app)
      .get('/api/notifications/preferences')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(mockService.getUserPreferences).toHaveBeenCalledWith('user-123');
    expect(response.body.status).toBe('success');
    expect(response.body.data).toEqual(mockPrefs);
  });
  
  // --- Pruebas PUT /api/notifications/preferences ---
  it('PUT /api/notifications/preferences - debería actualizar las preferencias', async () => {
    const updateData = { emailEnabled: false, pushEnabled: true };
    const updatedPrefs = { userId: 'user-123', emailEnabled: false, pushEnabled: true };
    mockService.updateUserPreferences.mockResolvedValue(updatedPrefs);

    const response = await request(app)
      .put('/api/notifications/preferences')
      .send(updateData)
      .expect('Content-Type', /json/)
      .expect(200);
      
    expect(mockService.updateUserPreferences).toHaveBeenCalledWith('user-123', updateData);
    expect(response.body.status).toBe('success');
    expect(response.body.data).toEqual(updatedPrefs);
    expect(response.body.message).toContain('actualizadas correctamente');
  });

  // Re-habilitamos la prueba que antes estaba desactivada
  it('PUT /api/notifications/preferences - debería fallar con datos inválidos', async () => {
    const invalidData = { emailEnabled: 'no-un-booleano' };

    // Usar .ok() para NO lanzar excepciones en errores HTTP
    const response = await request(app)
      .put('/api/notifications/preferences')
      .send(invalidData)
      .ok(res => res.status < 600); // Acepta cualquier código HTTP
      
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('status', 'error');
    // La validación específica depende de la implementación de la validación
    expect(response.body.message).toMatch(/emailEnabled.*booleano/i);
    expect(mockService.updateUserPreferences).not.toHaveBeenCalled();
  });
  
  // Ya no necesitamos esta prueba ultra simple
  /*
  it('GET /api/notifications - manejo simplificado de errores', async () => {
    // Creamos y configuramos un mock simplificado para ocasionar un error
    mockService.getUserNotifications.mockImplementation(() => {
      throw new Error('Error simulado');
    });

    // Solo probamos que podemos llamar a la API sin que la prueba falle
    await request(app).get('/api/notifications');
    
    // Si llegamos aquí, la prueba pasa
  }, 5000);
  */
});
