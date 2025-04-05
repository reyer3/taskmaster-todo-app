/**
 * Pruebas unitarias para NotificationService
 */
const { NotificationService } = require('../../../src/services/notification.service');
const { Notification } = require('../../../src/domain/notifications/notification.model');
const { v4: uuidv4 } = require('uuid');

// Mock de los repositorios
jest.mock('../../../src/infrastructure/repositories/notification.repository');
jest.mock('../../../src/infrastructure/repositories/notification-preference.repository');

// Mock de uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid')
}));

describe('NotificationService', () => {
  let notificationService;
  let mockNotificationRepository;
  let mockPreferenceRepository;
  let mockSocketServer;
  let mockEventPublisher;
  
  const mockUserId = 'user-123';
  const mockNotificationData = {
    id: 'notification-123',
    userId: mockUserId,
    type: 'task.created',
    title: 'Nueva tarea',
    message: 'Has creado una nueva tarea',
    isRead: false,
    data: { taskId: 'task-123' },
    relatedId: 'task-123',
    createdAt: new Date()
  };

  beforeEach(() => {
    // Crear mocks de los repositorios
    const NotificationRepository = require('../../../src/infrastructure/repositories/notification.repository').NotificationRepository;
    const NotificationPreferenceRepository = require('../../../src/infrastructure/repositories/notification-preference.repository').NotificationPreferenceRepository;
    
    mockNotificationRepository = new NotificationRepository();
    mockPreferenceRepository = new NotificationPreferenceRepository();
    
    // Crear mocks de WebSockets y EventPublisher
    mockSocketServer = {
      emitToUser: jest.fn(() => true)
    };
    
    mockEventPublisher = {
      publish: jest.fn()
    };
    
    // Crear instancia del servicio
    notificationService = new NotificationService(
      mockNotificationRepository,
      mockPreferenceRepository,
      {
        socketServer: mockSocketServer,
        eventPublisher: mockEventPublisher
      }
    );
    
    // Configurar implementaciones simuladas
    mockNotificationRepository.create = jest.fn(async (notification) => notification);
    mockNotificationRepository.findById = jest.fn(async (id) => {
      if (id === 'notification-123') {
        return new Notification(mockNotificationData);
      }
      return null;
    });
    
    mockNotificationRepository.findByUserId = jest.fn(async (userId, options) => {
      if (userId === mockUserId) {
        return [new Notification(mockNotificationData)];
      }
      return [];
    });
    
    mockNotificationRepository.update = jest.fn(async (notification) => {
      return notification;
    });
    mockNotificationRepository.markAsRead = jest.fn(async (id) => {
      return new Notification({
        ...mockNotificationData,
        isRead: true
      });
    });
    
    mockNotificationRepository.delete = jest.fn(async (id) => true);
    
    mockNotificationRepository.deleteExpired = jest.fn(async (olderThan) => 5);
    
    mockPreferenceRepository.findByUserId = jest.fn(async (userId) => {
      if (userId === mockUserId) {
        return {
          userId: mockUserId,
          emailEnabled: true,
          pushEnabled: true,
          emailTaskCreated: true,
          pushTaskCreated: true
        };
      }
      return null;
    });
  });

  describe('createNotification', () => {
    it('debería crear una notificación y emitirla en tiempo real', async () => {
      // Configurar
      const notificationData = {
        userId: mockUserId,
        type: 'task.created',
        title: 'Nueva tarea',
        message: 'Has creado una nueva tarea',
        data: { taskId: 'task-123' },
        relatedId: 'task-123'
      };
      
      // Ejecutar
      const result = await notificationService.createNotification(notificationData);
      
      // Verificar
      expect(uuidv4).toHaveBeenCalled();
      expect(mockNotificationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'mocked-uuid',
          userId: mockUserId,
          type: 'task.created',
          title: 'Nueva tarea',
          message: 'Has creado una nueva tarea',
          isRead: false
        })
      );
      
      // Verificar que se envía con el formato correcto: task.created => task:created
      expect(mockSocketServer.emitToUser).toHaveBeenCalledWith(
        mockUserId,
        'task:created',  // Tipo convertido de task.created a task:created
        expect.objectContaining({
          title: 'Nueva tarea',
          type: 'task.created',
          notificationId: 'mocked-uuid'
        })
      );
      
      expect(result).toEqual(expect.objectContaining({
        id: 'mocked-uuid',
        userId: mockUserId,
        type: 'task.created'
      }));
    });

    it('no debería emitir notificación en tiempo real si el socketServer no está disponible', async () => {
      // Configurar service sin socketServer
      notificationService = new NotificationService(
        mockNotificationRepository,
        mockPreferenceRepository,
        {
          eventPublisher: mockEventPublisher
        }
      );
      
      const notificationData = {
        userId: mockUserId,
        type: 'task.created',
        title: 'Nueva tarea',
        message: 'Has creado una nueva tarea'
      };
      
      // Ejecutar
      const result = await notificationService.createNotification(notificationData);
      
      // Verificar
      expect(mockNotificationRepository.create).toHaveBeenCalled();
      // No debería haber intentos de emitir
      expect(mockSocketServer.emitToUser).not.toHaveBeenCalled();
    });

    it('debería respetar las preferencias del usuario', async () => {
      // Configurar preferencias que deshabilitan notificaciones push
      mockPreferenceRepository.findByUserId = jest.fn(async (userId) => ({
        userId,
        emailEnabled: true,
        pushEnabled: false,
        emailTaskCreated: true,
        pushTaskCreated: false
      }));
      
      const notificationData = {
        userId: mockUserId,
        type: 'task.created',
        title: 'Nueva tarea',
        message: 'Has creado una nueva tarea'
      };
      
      // Ejecutar
      const result = await notificationService.createNotification(notificationData);
      
      // Verificar
      expect(mockNotificationRepository.create).toHaveBeenCalled();
      // No debería emitir si las preferencias lo deshabilitan
      expect(mockSocketServer.emitToUser).not.toHaveBeenCalled();
    });
  });

  describe('getUserNotifications', () => {
    it('debería obtener las notificaciones del usuario', async () => {
      // Ejecutar
      const result = await notificationService.getUserNotifications(mockUserId);
      
      // Verificar
      expect(mockNotificationRepository.findByUserId).toHaveBeenCalledWith(
        mockUserId,
        expect.any(Object)
      );
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(expect.objectContaining({
        id: mockNotificationData.id,
        type: mockNotificationData.type
      }));
    });

    it('debería aplicar filtros correctamente', async () => {
      // Ejecutar con filtros
      await notificationService.getUserNotifications(mockUserId, {
        isRead: false,
        type: 'task.created',
        limit: 10
      });
      
      // Verificar
      expect(mockNotificationRepository.findByUserId).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          isRead: false,
          type: 'task.created',
          limit: 10
        })
      );
    });

    it('debería devolver array vacío si no hay notificaciones', async () => {
      // Configurar repositorio para devolver vacío
      mockNotificationRepository.findByUserId = jest.fn(async () => []);
      
      // Ejecutar
      const result = await notificationService.getUserNotifications('unknown-user');
      
      // Verificar
      expect(result).toEqual([]);
    });
  });

  describe('markAsRead', () => {
    it('debería marcar una notificación como leída', async () => {
      // Ejecutar
      const result = await notificationService.markAsRead('notification-123', mockUserId);
      
      // Verificar
      expect(mockNotificationRepository.findById).toHaveBeenCalledWith('notification-123');
      expect(mockNotificationRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'notification-123',
          isRead: true
        })
      );
      
      expect(result).toEqual(expect.objectContaining({
        id: 'notification-123'
      }));
    });

    it('debería lanzar error si la notificación no existe', async () => {
      // Ejecutar y verificar
      await expect(notificationService.markAsRead('non-existent', mockUserId))
        .rejects.toThrow('Notificación no encontrada');
    });

    it('debería lanzar error si la notificación pertenece a otro usuario', async () => {
      // Ejecutar y verificar
      await expect(notificationService.markAsRead('notification-123', 'other-user'))
        .rejects.toThrow('No autorizado: No puedes marcar como leída una notificación que no te pertenece');
    });
  });

  describe('deleteNotification', () => {
    it('debería eliminar una notificación', async () => {
      // Ejecutar
      const result = await notificationService.deleteNotification('notification-123', mockUserId);
      
      // Verificar
      expect(mockNotificationRepository.findById).toHaveBeenCalledWith('notification-123');
      expect(mockNotificationRepository.delete).toHaveBeenCalledWith('notification-123');
      
      expect(result).toBe(true);
    });

    it('debería lanzar error si la notificación no existe', async () => {
      // Ejecutar y verificar
      await expect(notificationService.deleteNotification('non-existent', mockUserId))
        .rejects.toThrow('Notificación no encontrada');
    });

    it('debería lanzar error si la notificación pertenece a otro usuario', async () => {
      // Ejecutar y verificar
      await expect(notificationService.deleteNotification('notification-123', 'other-user'))
        .rejects.toThrow('No autorizado: No puedes eliminar una notificación que no te pertenece');
    });
  });

  describe('markAllAsRead', () => {
    it('debería marcar todas las notificaciones del usuario como leídas', async () => {
      // Configurar
      mockNotificationRepository.markAllAsRead = jest.fn(async (userId) => 3);
      
      // Ejecutar
      const result = await notificationService.markAllAsRead(mockUserId);
      
      // Verificar
      expect(mockNotificationRepository.markAllAsRead).toHaveBeenCalled();
      const args = mockNotificationRepository.markAllAsRead.mock.calls[0];
      expect(args[0]).toBe(mockUserId);
      expect(result).toBe(3);
    });

    it('debería aplicar filtros opcionales', async () => {
      // Configurar
      mockNotificationRepository.markAllAsRead = jest.fn(async (userId, filters) => 2);
      
      // Ejecutar
      await notificationService.markAllAsRead(mockUserId, { type: 'task.created' });
      
      // Verificar
      expect(mockNotificationRepository.markAllAsRead).toHaveBeenCalled();
      const args = mockNotificationRepository.markAllAsRead.mock.calls[0];
      expect(args[0]).toBe(mockUserId);
      expect(args[1]).toEqual(expect.objectContaining({ type: 'task.created' }));
    });
  });

  describe('getUserPreferences', () => {
    it('debería obtener las preferencias del usuario', async () => {
      // Ejecutar
      const result = await notificationService.getUserPreferences(mockUserId);
      
      // Verificar
      expect(mockPreferenceRepository.findByUserId).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual(expect.objectContaining({
        userId: mockUserId,
        emailEnabled: true,
        pushEnabled: true
      }));
    });

    it('debería crear preferencias por defecto si no existen', async () => {
      // Configurar
      mockPreferenceRepository.findByUserId = jest.fn(async () => null);
      mockPreferenceRepository.create = jest.fn(async (prefs) => prefs);
      
      // Ejecutar
      const result = await notificationService.getUserPreferences('new-user');
      
      // Verificar
      expect(mockPreferenceRepository.create).toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining({
        userId: 'new-user',
        emailEnabled: true,
        pushEnabled: true
      }));
    });
  });

  describe('updateUserPreferences', () => {
    it('debería actualizar las preferencias existentes', async () => {
      // Configurar
      mockPreferenceRepository.update = jest.fn(async (prefs) => prefs);
      
      const updates = {
        emailEnabled: false,
        pushTaskCreated: false
      };
      
      // Ejecutar
      const result = await notificationService.updateUserPreferences(mockUserId, updates);
      
      // Verificar
      expect(mockPreferenceRepository.update).toHaveBeenCalled();
      const callArg = mockPreferenceRepository.update.mock.calls[0][0];
      expect(callArg).toHaveProperty('userId', mockUserId);
      expect(callArg).toHaveProperty('emailEnabled', false);
      expect(callArg).toHaveProperty('pushTaskCreated', false);
    });

    it('debería crear preferencias si no existen', async () => {
      // Configurar
      mockPreferenceRepository.findByUserId = jest.fn(async () => null);
      mockPreferenceRepository.create = jest.fn(async (prefs) => prefs);
      
      // Ejecutar
      const result = await notificationService.updateUserPreferences('new-user', {
        emailEnabled: false
      });
      
      // Verificar
      expect(mockPreferenceRepository.create).toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining({
        userId: 'new-user',
        emailEnabled: false
      }));
    });

    it('debería ignorar propiedades inválidas', async () => {
      // Configurar
      mockPreferenceRepository.update = jest.fn(async (prefs) => prefs);
      
      // Ejecutar
      await notificationService.updateUserPreferences(mockUserId, {
        invalidProperty: 'value',
        emailEnabled: false
      });
      
      // Verificar - no debería incluir la propiedad inválida
      expect(mockPreferenceRepository.update).toHaveBeenCalled();
      
      // Comprobar manualmente que no tiene la propiedad inválida
      const updated = mockPreferenceRepository.update.mock.calls[0][0];
      expect(updated).not.toHaveProperty('invalidProperty');
      expect(updated).toHaveProperty('emailEnabled', false);
    });
  });

  describe('cleanupNotifications', () => {
    it('debería eliminar notificaciones antiguas', async () => {
      // Ejecutar
      const result = await notificationService.cleanupNotifications({
        olderThan: 30,
        onlyRead: true
      });
      
      // Verificar
      expect(mockNotificationRepository.deleteExpired).toHaveBeenCalled();
      const args = mockNotificationRepository.deleteExpired.mock.calls[0];
      expect(args[0]).toBe(30);
      expect(args[1]).toBe(true);
      
      expect(result).toBe(5);
    });

    it('debería usar valores por defecto', async () => {
      // Ejecutar
      await notificationService.cleanupNotifications();
      
      // Verificar que se llamó a deleteExpired (sin verificar parámetros específicos)
      expect(mockNotificationRepository.deleteExpired).toHaveBeenCalled();
    });
  });
});
