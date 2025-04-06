/**
 * Pruebas unitarias para RealtimeNotificationSubscriber
 */
const { RealtimeNotificationSubscriber } = require('../../../../src/infrastructure/websockets/realtime-notification-subscriber');
const { eventPublisher, eventTypes } = require('../../../../src/infrastructure/events');
const { UserEvents, TaskEvents, SystemEvents } = eventTypes;

// Mock del eventPublisher
jest.mock('../../../../src/infrastructure/events', () => {
  // Crear función subscribe mock que devuelve una función de anulación de suscripción
  const mockSubscribe = jest.fn(() => jest.fn());

  return {
    eventPublisher: {
      subscribe: mockSubscribe,
      publish: jest.fn()
    },
    eventTypes: {
      UserEvents: {
        LOGIN_SUCCESS: 'user.login.success'
      },
      TaskEvents: {
        CREATED: 'task.created',
        UPDATED: 'task.updated',
        COMPLETED: 'task.completed',
        DELETED: 'task.deleted',
        DUE_SOON: 'task.due_soon'
      },
      SystemEvents: {
        ERROR: 'system.error'
      }
    }
  };
});

describe('RealtimeNotificationSubscriber', () => {
  let subscriber;
  let mockSocketServer;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Espiar console.log y console.warn
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    
    // Crear mock para socketServer
    mockSocketServer = {
      emitToUser: jest.fn(() => true),
      emitToAll: jest.fn(() => true)
    };
    
    // Crear instancia del suscriptor con mocks
    subscriber = new RealtimeNotificationSubscriber({
      socketServer: mockSocketServer,
      enabled: true
    });
  });
  
  afterEach(() => {
    // Restaurar console mocks
    console.log.mockRestore();
    console.warn.mockRestore();
    console.error.mockRestore();
  });
  
  describe('initialize', () => {
    it('debería suscribirse a todos los eventos relevantes', () => {
      // Ejecutar inicialización
      subscriber.initialize();
      
      // Verificar que se suscribe a todos los eventos
      expect(eventPublisher.subscribe).toHaveBeenCalledWith(TaskEvents.CREATED, expect.any(Function));
      expect(eventPublisher.subscribe).toHaveBeenCalledWith(TaskEvents.UPDATED, expect.any(Function));
      expect(eventPublisher.subscribe).toHaveBeenCalledWith(TaskEvents.COMPLETED, expect.any(Function));
      expect(eventPublisher.subscribe).toHaveBeenCalledWith(TaskEvents.DELETED, expect.any(Function));
      expect(eventPublisher.subscribe).toHaveBeenCalledWith(TaskEvents.DUE_SOON, expect.any(Function));
      expect(eventPublisher.subscribe).toHaveBeenCalledWith(UserEvents.LOGIN_SUCCESS, expect.any(Function));
      expect(eventPublisher.subscribe).toHaveBeenCalledWith(SystemEvents.ERROR, expect.any(Function));
      
      // Verificar que guardó las funciones de anulación de suscripción
      expect(subscriber.unsubscribeFunctions.length).toBe(7);
    });
    
    it('no debería inicializar si está deshabilitado', () => {
      // Crear suscriptor deshabilitado
      subscriber = new RealtimeNotificationSubscriber({
        socketServer: mockSocketServer,
        enabled: false
      });
      
      // Ejecutar inicialización
      subscriber.initialize();
      
      // Verificar que no se suscribe a ningún evento
      expect(eventPublisher.subscribe).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalled();
    });
    
    it('no debería inicializar si no hay socketServer', () => {
      // Crear suscriptor sin socketServer
      subscriber = new RealtimeNotificationSubscriber({
        enabled: true
      });
      
      // Ejecutar inicialización
      subscriber.initialize();
      
      // Verificar que no se suscribe a ningún evento
      expect(eventPublisher.subscribe).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalled();
    });
  });
  
  describe('dispose', () => {
    it('debería anular todas las suscripciones', () => {
      // Añadir funciones mock de anulación de suscripción
      const unsubMock1 = jest.fn();
      const unsubMock2 = jest.fn();
      subscriber.unsubscribeFunctions = [unsubMock1, unsubMock2];
      
      // Ejecutar dispose
      subscriber.dispose();
      
      // Verificar que todas las funciones de anulación fueron llamadas
      expect(unsubMock1).toHaveBeenCalled();
      expect(unsubMock2).toHaveBeenCalled();
      
      // Verificar que la lista de funciones se limpió
      expect(subscriber.unsubscribeFunctions.length).toBe(0);
    });
  });
  
  describe('event handlers', () => {
    describe('handleLoginSuccess', () => {
      it('debería enviar notificación de login exitoso', async () => {
        // Crear evento de prueba
        const mockEvent = {
          type: UserEvents.LOGIN_SUCCESS,
          payload: {
            userId: 'user123',
            email: 'user@example.com'
          }
        };
        
        // Ejecutar manejador
        await subscriber.handleLoginSuccess(mockEvent);
        
        // Verificar que se emite al usuario correcto
        expect(mockSocketServer.emitToUser).toHaveBeenCalledWith(
          'user123',
          'auth:login_success',
          expect.objectContaining({
            message: expect.stringContaining('user@example.com'),
            timestamp: expect.any(String)
          })
        );
      });
    });
    
    describe('handleTaskCreated', () => {
      it('debería enviar notificación de tarea creada', async () => {
        // Crear evento de prueba
        const mockEvent = {
          type: TaskEvents.CREATED,
          payload: {
            userId: 'user123',
            taskId: 'task123',
            title: 'Nueva tarea',
            priority: 'high',
            dueDate: '2025-01-01'
          }
        };
        
        // Ejecutar manejador
        await subscriber.handleTaskCreated(mockEvent);
        
        // Verificar que se emite correctamente
        expect(mockSocketServer.emitToUser).toHaveBeenCalledWith(
          'user123',
          'task:created',
          expect.objectContaining({
            taskId: 'task123',
            title: 'Nueva tarea',
            message: expect.stringContaining('Nueva tarea')
          })
        );
      });
    });
    
    describe('handleTaskUpdated', () => {
      it('debería enviar notificación de tarea actualizada', async () => {
        // Crear evento de prueba
        const mockEvent = {
          type: TaskEvents.UPDATED,
          payload: {
            userId: 'user123',
            taskId: 'task123',
            title: 'Tarea actualizada',
            changes: { priority: 'high' }
          }
        };
        
        // Ejecutar manejador
        await subscriber.handleTaskUpdated(mockEvent);
        
        // Verificar que se emite correctamente
        expect(mockSocketServer.emitToUser).toHaveBeenCalledWith(
          'user123',
          'task:updated',
          expect.objectContaining({
            taskId: 'task123',
            changes: { priority: 'high' },
            message: expect.stringContaining('Tarea actualizada')
          })
        );
      });
      
      it('debería usar nombre genérico si no hay título', async () => {
        // Crear evento de prueba sin título
        const mockEvent = {
          type: TaskEvents.UPDATED,
          payload: {
            userId: 'user123',
            taskId: 'task123',
            changes: { priority: 'high' }
          }
        };
        
        // Ejecutar manejador
        await subscriber.handleTaskUpdated(mockEvent);
        
        // Verificar que se usa un nombre genérico
        expect(mockSocketServer.emitToUser).toHaveBeenCalledWith(
          'user123',
          'task:updated',
          expect.objectContaining({
            message: expect.stringContaining('Tarea')
          })
        );
      });
    });
    
    describe('handleTaskCompleted', () => {
      it('debería enviar notificación de tarea completada', async () => {
        // Crear evento de prueba
        const mockEvent = {
          type: TaskEvents.COMPLETED,
          payload: {
            userId: 'user123',
            taskId: 'task123',
            title: 'Tarea completada'
          }
        };
        
        // Ejecutar manejador
        await subscriber.handleTaskCompleted(mockEvent);
        
        // Verificar que se emite correctamente
        expect(mockSocketServer.emitToUser).toHaveBeenCalledWith(
          'user123',
          'task:completed',
          expect.objectContaining({
            taskId: 'task123',
            title: 'Tarea completada',
            message: expect.stringContaining('¡Felicidades!')
          })
        );
      });
    });
    
    describe('handleTaskDeleted', () => {
      it('debería enviar notificación de tarea eliminada', async () => {
        // Crear evento de prueba
        const mockEvent = {
          type: TaskEvents.DELETED,
          payload: {
            userId: 'user123',
            taskId: 'task123',
            title: 'Tarea eliminada'
          }
        };
        
        // Ejecutar manejador
        await subscriber.handleTaskDeleted(mockEvent);
        
        // Verificar que se emite correctamente
        expect(mockSocketServer.emitToUser).toHaveBeenCalledWith(
          'user123',
          'task:deleted',
          expect.objectContaining({
            taskId: 'task123',
            title: 'Tarea eliminada',
            message: expect.stringContaining('eliminada')
          })
        );
      });
    });
    
    describe('handleTasksDueSoon', () => {
      it('debería enviar notificación de tareas próximas a vencer', async () => {
        // Crear evento de prueba con múltiples tareas
        const mockTasks = [
          { id: 'task1', title: 'Tarea 1' },
          { id: 'task2', title: 'Tarea 2' },
          { id: 'task3', title: 'Tarea 3' },
          { id: 'task4', title: 'Tarea 4' },
          { id: 'task5', title: 'Tarea 5' },
          { id: 'task6', title: 'Tarea 6' }
        ];
        
        const mockEvent = {
          type: TaskEvents.DUE_SOON,
          payload: {
            userId: 'user123',
            tasks: mockTasks,
            daysWindow: 3
          }
        };
        
        // Ejecutar manejador
        await subscriber.handleTasksDueSoon(mockEvent);
        
        // Verificar que se emite correctamente
        expect(mockSocketServer.emitToUser).toHaveBeenCalledWith(
          'user123',
          'task:due_soon',
          expect.objectContaining({
            count: 6,
            tasks: mockTasks.slice(0, 5), // Solo primeras 5 tareas
            hasMore: true,
            daysWindow: 3,
            message: expect.stringContaining('6 tareas pendientes')
          })
        );
      });
      
      it('no debería enviar notificación si no hay tareas próximas', async () => {
        // Crear evento de prueba sin tareas
        const mockEvent = {
          type: TaskEvents.DUE_SOON,
          payload: {
            userId: 'user123',
            tasks: [],
            daysWindow: 3
          }
        };
        
        // Ejecutar manejador
        await subscriber.handleTasksDueSoon(mockEvent);
        
        // Verificar que no se emite nada
        expect(mockSocketServer.emitToUser).not.toHaveBeenCalled();
      });
      
      it('debería ajustar el mensaje para una sola tarea', async () => {
        // Crear evento de prueba con una sola tarea
        const mockEvent = {
          type: TaskEvents.DUE_SOON,
          payload: {
            userId: 'user123',
            tasks: [{ id: 'task1', title: 'Tarea 1' }],
            daysWindow: 3
          }
        };
        
        // Ejecutar manejador
        await subscriber.handleTasksDueSoon(mockEvent);
        
        // Verificar que el mensaje es singular
        expect(mockSocketServer.emitToUser).toHaveBeenCalledWith(
          'user123',
          'task:due_soon',
          expect.objectContaining({
            message: expect.stringContaining('1 tarea pendiente')
          })
        );
      });
    });
    
    describe('handleSystemError', () => {
      it('debería registrar el error pero no enviar notificación', async () => {
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
        
        // Ejecutar manejador
        await subscriber.handleSystemError(mockEvent);
        
        // Verificar que se registra pero no se envía
        expect(errorSpy).toHaveBeenCalled();
        expect(mockSocketServer.emitToUser).not.toHaveBeenCalled();
        expect(mockSocketServer.emitToAll).not.toHaveBeenCalled();
      });
    });
  });
}); 