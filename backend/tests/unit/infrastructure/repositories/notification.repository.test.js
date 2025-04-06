/**
 * Pruebas unitarias para NotificationRepository
 */

// Definir los mocks antes de importar los módulos
const mockPrismaNotification = {
  findMany: jest.fn(),
  findUnique: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  updateMany: jest.fn(),
  delete: jest.fn(),
  deleteMany: jest.fn(),
  count: jest.fn()
};

// Usar doMock en lugar de mock para evitar el hoisting
jest.doMock('../../../../src/infrastructure/database/prisma-client', () => ({
  prisma: {
    notification: mockPrismaNotification
  }
}));

// Importar los módulos después de configurar los mocks
const { NotificationRepository } = require('../../../../src/infrastructure/repositories/notification.repository');
const { Notification } = require('../../../../src/domain/notifications/notification.model');

describe('NotificationRepository', () => {
  let repository;
  let mockNotification;

  beforeEach(() => {
    // Resetear todos los mocks antes de cada test
    jest.clearAllMocks();
    
    // Crear instancia del repositorio
    repository = new NotificationRepository();
    
    // Crear una notificación de ejemplo
    mockNotification = new Notification({
      id: 'notification123',
      userId: 'user123',
      type: 'task.created',
      title: 'Nueva tarea',
      message: 'Has creado una nueva tarea',
      isRead: false,
      data: { taskId: 'task123' },
      relatedId: 'task123',
      createdAt: new Date('2025-01-01'),
      expiresAt: new Date('2025-02-01')
    });
  });

  describe('findByUserId', () => {
    it('debería obtener notificaciones de un usuario', async () => {
      // Configurar el mock
      const mockDbNotifications = [
        {
          id: 'notification123',
          userId: 'user123',
          type: 'task.created',
          title: 'Nueva tarea',
          message: 'Has creado una nueva tarea',
          isRead: false,
          data: { taskId: 'task123' },
          relatedId: 'task123',
          createdAt: new Date('2025-01-01'),
          expiresAt: new Date('2025-02-01')
        },
        {
          id: 'notification124',
          userId: 'user123',
          type: 'task.updated',
          title: 'Tarea actualizada',
          message: 'La tarea ha sido actualizada',
          isRead: true,
          data: { taskId: 'task123' },
          relatedId: 'task123',
          createdAt: new Date('2025-01-02'),
          expiresAt: null
        }
      ];
      
      mockPrismaNotification.findMany.mockResolvedValue(mockDbNotifications);
      
      // Ejecutar método
      const result = await repository.findByUserId('user123');
      
      // Verificaciones
      expect(mockPrismaNotification.findMany).toHaveBeenCalledWith({
        where: { userId: 'user123' },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 50
      });
      
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(Notification);
      expect(result[0].id).toBe('notification123');
      expect(result[1]).toBeInstanceOf(Notification);
      expect(result[1].id).toBe('notification124');
    });

    it('debería aplicar opciones de filtrado', async () => {
      // Configurar el mock
      mockPrismaNotification.findMany.mockResolvedValue([]);
      
      // Ejecutar método con opciones
      await repository.findByUserId('user123', {
        limit: 10,
        offset: 5,
        onlyUnread: true,
        types: ['task.created', 'task.updated'],
        sortDirection: 'asc'
      });
      
      // Verificaciones
      expect(mockPrismaNotification.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user123',
          isRead: false,
          type: { in: ['task.created', 'task.updated'] }
        },
        orderBy: { createdAt: 'asc' },
        skip: 5,
        take: 10
      });
    });
  });

  describe('findById', () => {
    it('debería encontrar una notificación por id', async () => {
      // Configurar el mock
      mockPrismaNotification.findUnique.mockResolvedValue({
        id: 'notification123',
        userId: 'user123',
        type: 'task.created',
        title: 'Nueva tarea',
        message: 'Has creado una nueva tarea',
        isRead: false,
        data: { taskId: 'task123' },
        relatedId: 'task123',
        createdAt: new Date('2025-01-01'),
        expiresAt: new Date('2025-02-01')
      });
      
      // Ejecutar método
      const result = await repository.findById('notification123');
      
      // Verificaciones
      expect(mockPrismaNotification.findUnique).toHaveBeenCalledWith({
        where: { id: 'notification123' }
      });
      
      expect(result).toBeInstanceOf(Notification);
      expect(result.id).toBe('notification123');
      expect(result.type).toBe('task.created');
    });

    it('debería retornar null si no encuentra la notificación', async () => {
      // Configurar el mock
      mockPrismaNotification.findUnique.mockResolvedValue(null);
      
      // Ejecutar método
      const result = await repository.findById('notification999');
      
      // Verificaciones
      expect(mockPrismaNotification.findUnique).toHaveBeenCalledWith({
        where: { id: 'notification999' }
      });
      
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('debería crear una nueva notificación', async () => {
      // Configurar el mock
      mockPrismaNotification.create.mockResolvedValue({
        id: 'notification123',
        userId: 'user123',
        type: 'task.created',
        title: 'Nueva tarea',
        message: 'Has creado una nueva tarea',
        isRead: false,
        data: { taskId: 'task123' },
        relatedId: 'task123',
        createdAt: new Date('2025-01-01'),
        expiresAt: new Date('2025-02-01')
      });
      
      // Ejecutar método
      const result = await repository.create(mockNotification);
      
      // Verificaciones
      expect(mockPrismaNotification.create).toHaveBeenCalledWith({
        data: {
          id: 'notification123',
          userId: 'user123',
          type: 'task.created',
          title: 'Nueva tarea',
          message: 'Has creado una nueva tarea',
          isRead: false,
          data: { taskId: 'task123' },
          relatedId: 'task123',
          expiresAt: mockNotification.expiresAt
        }
      });
      
      expect(result).toBeInstanceOf(Notification);
      expect(result.id).toBe('notification123');
    });
  });

  describe('update', () => {
    it('debería actualizar una notificación existente', async () => {
      // Configurar el mock
      mockPrismaNotification.update.mockResolvedValue({
        id: 'notification123',
        userId: 'user123',
        type: 'task.created',
        title: 'Nueva tarea',
        message: 'Has creado una nueva tarea',
        isRead: true, // Actualizado
        data: { taskId: 'task123' },
        relatedId: 'task123',
        createdAt: new Date('2025-01-01'),
        expiresAt: new Date('2025-02-01')
      });
      
      // Modificar la notificación para actualizarla
      mockNotification.markAsRead();
      
      // Ejecutar método
      const result = await repository.update(mockNotification);
      
      // Verificaciones
      expect(mockPrismaNotification.update).toHaveBeenCalledWith({
        where: { id: 'notification123' },
        data: {
          isRead: true,
          expiresAt: mockNotification.expiresAt
        }
      });
      
      expect(result).toBeInstanceOf(Notification);
      expect(result.id).toBe('notification123');
      expect(result.isRead).toBe(true);
    });
  });

  describe('markAsRead', () => {
    it('debería marcar todas las notificaciones de un usuario como leídas', async () => {
      // Configurar el mock
      mockPrismaNotification.updateMany.mockResolvedValue({ count: 5 });
      
      // Ejecutar método
      const count = await repository.markAsRead('user123');
      
      // Verificaciones
      expect(mockPrismaNotification.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'user123',
          isRead: false
        },
        data: {
          isRead: true
        }
      });
      
      expect(count).toBe(5);
    });

    it('debería marcar notificaciones específicas como leídas', async () => {
      // Configurar el mock
      mockPrismaNotification.updateMany.mockResolvedValue({ count: 2 });
      
      // Ejecutar método con IDs específicos
      const count = await repository.markAsRead('user123', ['notification1', 'notification2']);
      
      // Verificaciones
      expect(mockPrismaNotification.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'user123',
          isRead: false,
          id: { in: ['notification1', 'notification2'] }
        },
        data: {
          isRead: true
        }
      });
      
      expect(count).toBe(2);
    });
  });

  describe('deleteExpired', () => {
    it('debería eliminar notificaciones expiradas', async () => {
      // Mock para Date.now()
      const originalDate = global.Date;
      const mockNow = new Date('2025-01-09T00:00:00.000Z');
      
      const OriginalDate = Date;
      
      global.Date = class extends OriginalDate {
        constructor(...args) {
          super();
          if (args.length === 0) {
            return mockNow;
          }
          return new OriginalDate(...args);
        }

        static now() {
          return mockNow.getTime();
        }
      };
      
      // Asegurarse de que Date.now funcione apropiadamente
      global.Date.now = jest.fn(() => mockNow.getTime());
      
      // Configurar el mock
      mockPrismaNotification.deleteMany.mockResolvedValue({ count: 3 });
      
      try {
        // Ejecutar método - usando 30 como número de días
        const count = await repository.deleteExpired(30, true);
        
        // Verificar que se llamó al método deleteMany
        expect(mockPrismaNotification.deleteMany).toHaveBeenCalled();
        
        const whereClause = mockPrismaNotification.deleteMany.mock.calls[0][0].where;
        expect(whereClause).toBeDefined();
        expect(whereClause.OR).toBeDefined();
        expect(whereClause.OR.length).toBe(2);
        
        // Verificar que el primer elemento tiene expiresAt y es Date
        expect(whereClause.OR[0].expiresAt).toBeDefined();
        expect(whereClause.OR[0].expiresAt.lt).toBeDefined();
        
        // Verificar que el segundo elemento tiene createdAt y es Date
        expect(whereClause.OR[1].createdAt).toBeDefined();
        expect(whereClause.OR[1].createdAt.lt).toBeDefined();
        
        // Verificar el valor de isRead
        expect(whereClause.OR[1].isRead).toBe(true);
        
        expect(count).toBe(3);
      } finally {
        // Restaurar Date original
        global.Date = originalDate;
      }
    });

    it('debería aceptar opciones personalizadas', async () => {
      // Mock para Date
      const originalDate = global.Date;
      const mockNow = new Date('2025-01-09T00:00:00.000Z');
      const OriginalDate = Date;
      
      global.Date = class extends OriginalDate {
        constructor(...args) {
          super();
          if (args.length === 0) {
            return mockNow;
          }
          return new OriginalDate(...args);
        }
        
        static now() {
          return mockNow.getTime();
        }
      };
      
      // Asegurarse de que Date.now funcione apropiadamente
      global.Date.now = jest.fn(() => mockNow.getTime());
      
      // Configurar el mock
      mockPrismaNotification.deleteMany.mockResolvedValue({ count: 7 });
      
      try {
        // Ejecutar método con opciones directamente
        const count = await repository.deleteExpired(60, false);
        
        // Verificar que se llamó al método deleteMany
        expect(mockPrismaNotification.deleteMany).toHaveBeenCalled();
        
        const whereClause = mockPrismaNotification.deleteMany.mock.calls[0][0].where;
        expect(whereClause).toBeDefined();
        expect(whereClause.OR).toBeDefined();
        expect(whereClause.OR.length).toBe(2);
        
        // Verificar que el primer elemento tiene expiresAt y es Date
        expect(whereClause.OR[0].expiresAt).toBeDefined();
        expect(whereClause.OR[0].expiresAt.lt).toBeDefined();
        
        // Verificar que el segundo elemento tiene createdAt y es Date
        expect(whereClause.OR[1].createdAt).toBeDefined();
        expect(whereClause.OR[1].createdAt.lt).toBeDefined();
        
        // Verificar que NO tiene isRead porque pasamos false como segundo parámetro
        expect(whereClause.OR[1].isRead).toBeUndefined();
        
        expect(count).toBe(7);
      } finally {
        // Restaurar Date original
        global.Date = originalDate;
      }
    });
  });

  describe('delete', () => {
    it('debería eliminar una notificación específica', async () => {
      // Configurar el mock
      mockPrismaNotification.delete.mockResolvedValue({});
      
      // Ejecutar método
      const result = await repository.delete('notification123');
      
      // Verificaciones
      expect(mockPrismaNotification.delete).toHaveBeenCalledWith({
        where: { id: 'notification123' }
      });
      
      expect(result).toBe(true);
    });
  });

  describe('deleteAllForUser', () => {
    it('debería eliminar todas las notificaciones leídas de un usuario por defecto', async () => {
      // Configurar el mock
      mockPrismaNotification.deleteMany.mockResolvedValue({ count: 10 });
      
      // Ejecutar método
      const count = await repository.deleteAllForUser('user123');
      
      // Verificaciones
      expect(mockPrismaNotification.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: 'user123',
          isRead: true
        }
      });
      
      expect(count).toBe(10);
    });

    it('debería eliminar todas las notificaciones de un usuario si onlyRead=false', async () => {
      // Configurar el mock
      mockPrismaNotification.deleteMany.mockResolvedValue({ count: 15 });
      
      // Ejecutar método
      const count = await repository.deleteAllForUser('user123', { onlyRead: false });
      
      // Verificaciones
      expect(mockPrismaNotification.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: 'user123'
        }
      });
      
      expect(count).toBe(15);
    });
  });

  describe('countUnread', () => {
    it('debería contar las notificaciones no leídas de un usuario', async () => {
      // Configurar el mock
      mockPrismaNotification.count.mockResolvedValue(7);
      
      // Ejecutar método
      const count = await repository.countUnread('user123');
      
      // Verificaciones
      expect(mockPrismaNotification.count).toHaveBeenCalledWith({
        where: {
          userId: 'user123',
          isRead: false
        }
      });
      
      expect(count).toBe(7);
    });
  });
});
