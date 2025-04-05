/**
 * Pruebas unitarias para RealtimeNotificationSubscriber
 */
// Mock para NotificationService
jest.mock('../../../../../src/services/notification.service');

// Definir los mocks antes de usarlos
const mockSubscribe = jest.fn();
const mockUnsubscribe = jest.fn();

// Mock para eventPublisher
jest.mock('../../../../../src/infrastructure/events', () => {
  // Devolver una función para cada tipo de evento
  mockSubscribe.mockImplementation(() => mockUnsubscribe);
  
  return {
    eventPublisher: {
      subscribe: mockSubscribe,
      publish: jest.fn()
    },
    eventTypes: {
      TaskEvents: {
        CREATED: 'task.created',
        COMPLETED: 'task.completed',
        UPDATED: 'task.updated',
        DELETED: 'task.deleted',
        DUE_SOON: 'task.due_soon'
      },
      UserEvents: {
        LOGIN_SUCCESS: 'user.login.success'
      },
      SystemEvents: {
        ERROR: 'system.error'
      }
    }
  };
});

const { RealtimeNotificationSubscriber } = require('../../../../../src/infrastructure/websockets/realtime-notification-subscriber');
const { eventTypes } = require('../../../../../src/infrastructure/events');
const { TaskEvents, UserEvents, SystemEvents } = eventTypes;

describe('RealtimeNotificationSubscriber', () => {
  // Constantes de prueba
  const TEST_USER_ID = 'user-123';
  const TEST_TASK_ID = 'task-123';
  const TEST_EMAIL = 'user@example.com';

  let subscriber;
  let mockSocketServer;
  let mockNotificationService;

  /**
   * Crea los mocks necesarios para las pruebas
   */
  function setupMocks() {
    mockSocketServer = {
      emitToUser: jest.fn(() => true),
      emitToAll: jest.fn(() => true)
    };

    const NotificationService = require('../../../../../src/services/notification.service').NotificationService;
    mockNotificationService = new NotificationService();
    mockNotificationService.createNotification = jest.fn(async (data) => ({
      id: 'notification-id',
      ...data
    }));
  }

  beforeEach(() => {
    // Limpiar todos los mocks
    jest.clearAllMocks();
    setupMocks();

    // Crear el suscriptor
    subscriber = new RealtimeNotificationSubscriber({
      socketServer: mockSocketServer,
      notificationService: mockNotificationService,
      enabled: true
    });
  });

  describe('initialize', () => {
    it('debería suscribirse a los eventos necesarios', () => {
      // Ejecutar
      subscriber.initialize();

      // Verificar que se suscribe a los eventos correctos
      expect(mockSubscribe).toHaveBeenCalledWith(
          TaskEvents.CREATED,
          expect.any(Function)
      );
      expect(mockSubscribe).toHaveBeenCalledWith(
          TaskEvents.COMPLETED,
          expect.any(Function)
      );
      expect(mockSubscribe).toHaveBeenCalledWith(
          UserEvents.LOGIN_SUCCESS,
          expect.any(Function)
      );
    });

    it('no debería suscribirse a eventos si no está habilitado', () => {
      // Crear suscriptor deshabilitado
      subscriber = new RealtimeNotificationSubscriber({
        socketServer: mockSocketServer,
        enabled: false
      });

      // Ejecutar
      subscriber.initialize();

      // Verificar que no se suscribe a ningún evento
      expect(mockSubscribe).not.toHaveBeenCalled();
    });
  });

  describe('dispose', () => {
    it('debería cancelar todas las suscripciones', () => {
      // Configurar
      const mockUnsubscribe1 = jest.fn();
      const mockUnsubscribe2 = jest.fn();

      mockSubscribe
          .mockReturnValueOnce(mockUnsubscribe1)
          .mockReturnValueOnce(mockUnsubscribe2);

      // Inicializar para crear suscripciones
      subscriber.initialize();

      // Ejecutar
      subscriber.dispose();

      // Verificar que se llamaron todas las funciones de unsubscribe
      expect(mockUnsubscribe1).toHaveBeenCalled();
      expect(mockUnsubscribe2).toHaveBeenCalled();
    });
  });

  describe('event handlers', () => {
    beforeEach(() => {
      subscriber.initialize();
    });

    it('handleTaskCreated debería enviar notificación de tarea creada', async () => {
      // Crear evento de prueba
      const mockEvent = {
        type: TaskEvents.CREATED,
        payload: {
          userId: TEST_USER_ID,
          taskId: TEST_TASK_ID,
          title: 'Nueva tarea',
          priority: 'high',
          dueDate: '2025-01-01'
        }
      };
      
      // Llamar directamente al método del handler
      await subscriber.handleTaskCreated(mockEvent);
      
      // Verificar que se emite correctamente
      expect(mockSocketServer.emitToUser).toHaveBeenCalledWith(
        TEST_USER_ID,
        'task:created',
        expect.objectContaining({
          taskId: TEST_TASK_ID,
          title: 'Nueva tarea',
          message: expect.stringContaining('Nueva tarea')
        })
      );
    });

    it('handleLoginSuccess debería enviar notificación de login exitoso', async () => {
      // Crear evento de prueba
      const mockEvent = {
        type: UserEvents.LOGIN_SUCCESS,
        payload: {
          userId: TEST_USER_ID,
          email: TEST_EMAIL
        }
      };
      
      // Llamar directamente al método del handler
      await subscriber.handleLoginSuccess(mockEvent);
      
      // Verificar que se emite al usuario correcto
      expect(mockSocketServer.emitToUser).toHaveBeenCalledWith(
        TEST_USER_ID,
        'auth:login_success',
        expect.objectContaining({
          message: expect.any(String),
          timestamp: expect.any(String)
        })
      );
    });

    it('handleSystemError debería registrar el error pero no enviar notificación', async () => {
      // Crear evento de prueba
      const mockEvent = {
        type: SystemEvents.ERROR,
        payload: {
          message: 'Error crítico',
          stack: 'Error stack trace'
        }
      };
      
      // Espía específico para console.error
      const errorSpy = jest.spyOn(console, 'error');
      
      // Llamar directamente al método del handler
      await subscriber.handleSystemError(mockEvent);
      
      // Verificar que se registra pero no se envía
      expect(errorSpy).toHaveBeenCalled();
      expect(mockSocketServer.emitToUser).not.toHaveBeenCalled();
      expect(mockSocketServer.emitToAll).not.toHaveBeenCalled();
      
      // Restaurar el spy
      errorSpy.mockRestore();
    });
  });
});