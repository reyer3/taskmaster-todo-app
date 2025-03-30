/**
 * Pruebas unitarias para TaskRepository
 */
const { TaskRepository } = require('../../../../src/infrastructure/repositories/task.repository');
const { Task } = require('../../../../src/domain/tasks/task.model');

// Mock para Prisma Client
jest.mock('@prisma/client', () => {
  const mockPrismaTask = {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  
  return {
    PrismaClient: jest.fn(() => ({
      task: mockPrismaTask,
      $connect: jest.fn(),
      $disconnect: jest.fn(),
    })),
  };
});

// Importar prisma client después del mock
const { PrismaClient } = require('@prisma/client');
const prismaClient = new PrismaClient();
const mockPrismaTask = prismaClient.task;

describe('TaskRepository', () => {
  let taskRepository;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create a new repository instance for each test
    taskRepository = new TaskRepository();
  });

  describe('findAllByUserId', () => {
    it('debería obtener todas las tareas de un usuario', async () => {
      // Datos de prueba
      const userId = 'user123';
      const prismaTasks = [
        {
          id: 'task1',
          title: 'Tarea 1',
          description: 'Descripción 1',
          completed: false,
          userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'task2',
          title: 'Tarea 2',
          description: 'Descripción 2',
          completed: true,
          userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      
      // Setup del mock
      mockPrismaTask.findMany.mockResolvedValue(prismaTasks);
      
      // Ejecución del método
      const result = await taskRepository.findAllByUserId(userId);
      
      // Verificaciones
      expect(mockPrismaTask.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: expect.any(Object),
      });
      
      // Verificar que el resultado es un array de instancias de Task
      expect(result.length).toBe(2);
      expect(result[0]).toBeInstanceOf(Task);
      expect(result[1]).toBeInstanceOf(Task);
      
      // Verificar datos
      expect(result[0].id).toBe('task1');
      expect(result[1].id).toBe('task2');
    });

    it('debería devolver un array vacío si no hay tareas', async () => {
      // Setup del mock
      mockPrismaTask.findMany.mockResolvedValue([]);
      
      // Ejecución del método
      const result = await taskRepository.findAllByUserId('user123');
      
      // Verificaciones
      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('debería obtener una tarea por ID', async () => {
      // Datos de prueba
      const taskId = 'task123';
      const prismaTask = {
        id: taskId,
        title: 'Tarea de prueba',
        description: 'Descripción de prueba',
        completed: false,
        userId: 'user123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Setup del mock
      mockPrismaTask.findUnique.mockResolvedValue(prismaTask);
      
      // Ejecución del método
      const result = await taskRepository.findById(taskId);
      
      // Verificaciones
      expect(mockPrismaTask.findUnique).toHaveBeenCalledWith({
        where: { id: taskId },
      });
      
      // Verificar que el resultado es una instancia de Task
      expect(result).toBeInstanceOf(Task);
      expect(result.id).toBe(taskId);
      expect(result.title).toBe(prismaTask.title);
    });

    it('debería devolver null si la tarea no existe', async () => {
      // Setup del mock
      mockPrismaTask.findUnique.mockResolvedValue(null);
      
      // Ejecución del método
      const result = await taskRepository.findById('nonexistent');
      
      // Verificaciones
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('debería crear una nueva tarea', async () => {
      // Datos de prueba
      const taskData = {
        id: 'task123',
        title: 'Nueva tarea',
        description: 'Descripción de la tarea',
        completed: false,
        userId: 'user123',
        dueDate: new Date('2025-12-31'),
        priority: 'high',
        category: 'trabajo',
      };
      
      const task = new Task(taskData);
      
      const prismaSavedTask = {
        ...taskData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Setup del mock
      mockPrismaTask.create.mockResolvedValue(prismaSavedTask);
      
      // Ejecución del método
      const result = await taskRepository.create(task);
      
      // Verificaciones
      expect(mockPrismaTask.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: task.id,
          title: task.title,
          description: task.description,
          userId: task.userId,
          completed: task.completed,
          dueDate: task.dueDate,
          priority: task.priority,
          category: task.category,
        }),
      });
      
      // Verificar que el resultado es una instancia de Task
      expect(result).toBeInstanceOf(Task);
      expect(result.id).toBe(task.id);
      expect(result.title).toBe(task.title);
    });
  });

  describe('update', () => {
    it('debería actualizar una tarea existente', async () => {
      // Datos de prueba
      const taskData = {
        id: 'task123',
        title: 'Tarea actualizada',
        description: 'Descripción actualizada',
        completed: true,
        userId: 'user123',
      };
      
      const task = new Task(taskData);
      
      const prismaSavedTask = {
        ...taskData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Setup del mock
      mockPrismaTask.update.mockResolvedValue(prismaSavedTask);
      
      // Ejecución del método
      const result = await taskRepository.update(task);
      
      // Verificaciones
      expect(mockPrismaTask.update).toHaveBeenCalledWith({
        where: { id: task.id },
        data: expect.any(Object),
      });
      
      // Verificar que el resultado es una instancia de Task
      expect(result).toBeInstanceOf(Task);
      expect(result.id).toBe(task.id);
      expect(result.title).toBe(task.title);
      expect(result.completed).toBe(task.completed);
    });
  });

  describe('delete', () => {
    it('debería eliminar una tarea', async () => {
      // Datos de prueba
      const taskId = 'task123';
      
      // Setup del mock
      mockPrismaTask.delete.mockResolvedValue({
        id: taskId,
        title: 'Tarea eliminada',
      });
      
      // Ejecución del método
      const result = await taskRepository.delete(taskId);
      
      // Verificaciones
      expect(mockPrismaTask.delete).toHaveBeenCalledWith({
        where: { id: taskId },
      });
      
      expect(result).toBe(true);
    });

    it('debería manejar errores al eliminar', async () => {
      // Setup del mock para simular un error
      mockPrismaTask.delete.mockRejectedValue(new Error('Error al eliminar'));
      
      // Ejecución del método y verificación
      await expect(taskRepository.delete('task123')).rejects.toThrow('Error al eliminar');
    });
  });

  describe('findUpcomingTasks', () => {
    it('debería encontrar tareas próximas a vencer', async () => {
      // Datos de prueba
      const userId = 'user123';
      const days = 7;
      
      // Calcular fecha límite (hoy + días)
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + days);
      
      const mockTasks = [
        {
          id: 'task1',
          title: 'Tarea próxima 1',
          dueDate: new Date(today.getTime() + 86400000), // Mañana
          userId,
          completed: false,
        },
        {
          id: 'task2',
          title: 'Tarea próxima 2',
          dueDate: new Date(today.getTime() + 172800000), // En 2 días
          userId,
          completed: false,
        }
      ];
      
      // Setup del mock
      mockPrismaTask.findMany.mockResolvedValue(mockTasks);
      
      // Ejecución del método
      const result = await taskRepository.findUpcomingTasks(userId, days);
      
      // Verificaciones
      expect(mockPrismaTask.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          userId,
          completed: false,
          dueDate: expect.any(Object)
        }),
        orderBy: expect.any(Object),
      });
      
      // Verificar que el resultado son instancias de Task
      expect(result.length).toBe(2);
      expect(result[0]).toBeInstanceOf(Task);
      expect(result[1]).toBeInstanceOf(Task);
    });

    it('debería usar 7 días como valor predeterminado', async () => {
      // Datos de prueba
      const userId = 'user123';
      
      // Setup del mock
      mockPrismaTask.findMany.mockResolvedValue([]);
      
      // Ejecución del método sin especificar días
      await taskRepository.findUpcomingTasks(userId);
      
      // Verificaciones
      const whereCriteria = mockPrismaTask.findMany.mock.calls[0][0].where;
      
      // Esperamos que dueDate.lte sea aproximadamente ahora + 7 días
      const lteDate = whereCriteria.dueDate.lte;
      const now = new Date();
      const expectedDate = new Date(now);
      expectedDate.setDate(now.getDate() + 7);
      
      // Permitir una diferencia de hasta 1 segundo para la comparación
      const timeDiff = Math.abs(lteDate.getTime() - expectedDate.getTime());
      expect(timeDiff).toBeLessThan(1000);
    });
  });
});
