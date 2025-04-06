/**
 * Pruebas unitarias para TaskService
 */
const { TaskService } = require('../../../src/services/task.service');
const { Task } = require('../../../src/domain/tasks/task.model');
const { NotFoundError, AuthorizationError } = require('../../../src/utils/errors/app-error');

// Mock para TaskRepository
const mockTaskRepository = {
  findAllByUserId: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findUpcomingTasks: jest.fn()
};

// Mock para EventPublisher
const mockEventPublisher = {
  publish: jest.fn().mockResolvedValue()
};

// Mock para UUID
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mocked-uuid')
}));

describe('TaskService', () => {
  let taskService;

  beforeEach(() => {
    // Reset de todos los mocks antes de cada test
    jest.clearAllMocks();
    
    // Crear una nueva instancia para cada test
    taskService = new TaskService(mockTaskRepository, { 
      eventPublisher: mockEventPublisher 
    });
  });

  describe('getUserTasks', () => {
    it('debería obtener todas las tareas de un usuario', async () => {
      // Datos de prueba
      const userId = 'user123';
      const mockTasks = [
        { id: 'task1', title: 'Tarea 1', userId },
        { id: 'task2', title: 'Tarea 2', userId }
      ];
      
      // Setup del mock
      mockTaskRepository.findAllByUserId.mockResolvedValue(mockTasks);
      
      // Ejecución del método
      const result = await taskService.getUserTasks(userId);
      
      // Verificaciones
      expect(mockTaskRepository.findAllByUserId).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockTasks);
      expect(result.length).toBe(2);
    });
  });

  describe('createTask', () => {
    it('debería crear una nueva tarea correctamente', async () => {
      // Datos de prueba
      const userId = 'user123';
      const taskData = {
        title: 'Nueva tarea',
        description: 'Descripción de la tarea',
        dueDate: new Date('2025-12-31'),
        priority: 'high',
        category: 'trabajo'
      };
      
      // Task esperada a ser creada
      const expectedTask = new Task({
        id: 'mocked-uuid',
        title: taskData.title,
        description: taskData.description,
        userId,
        dueDate: taskData.dueDate,
        priority: taskData.priority,
        category: taskData.category,
        completed: false
      });
      
      // Setup del mock
      mockTaskRepository.create.mockResolvedValue(expectedTask);
      
      // Ejecución del método
      const result = await taskService.createTask(taskData, userId);
      
      // Verificaciones
      expect(mockTaskRepository.create).toHaveBeenCalledWith(expect.any(Task));
      expect(result).toEqual(expectedTask);
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        'task.created',
        expect.objectContaining({
          taskId: 'mocked-uuid',
          userId,
          title: taskData.title
        })
      );
    });
  });

  describe('updateTask', () => {
    it('debería actualizar una tarea existente', async () => {
      // Datos de prueba
      const taskId = 'task123';
      const userId = 'user123';
      const updates = {
        title: 'Título actualizado',
        description: 'Descripción actualizada'
      };
      
      // Mock de la tarea existente
      const existingTask = new Task({
        id: taskId,
        title: 'Título original',
        description: 'Descripción original',
        userId,
        completed: false
      });
      
      // Mock de la tarea actualizada
      const updatedTask = new Task({
        id: taskId,
        title: updates.title,
        description: updates.description,
        userId,
        completed: false
      });
      
      // Setup de los mocks
      mockTaskRepository.findById.mockResolvedValue(existingTask);
      mockTaskRepository.update.mockResolvedValue(updatedTask);
      
      // Ejecución del método
      const result = await taskService.updateTask(taskId, updates, userId);
      
      // Verificaciones
      expect(mockTaskRepository.findById).toHaveBeenCalledWith(taskId);
      expect(mockTaskRepository.update).toHaveBeenCalled();
      expect(result).toEqual(updatedTask);
      expect(result.title).toBe(updates.title);
      expect(result.description).toBe(updates.description);
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        'task.updated',
        expect.objectContaining({
          taskId,
          userId,
          changes: Object.keys(updates)
        })
      );
    });

    it('debería lanzar NotFoundError si la tarea no existe', async () => {
      // Setup del mock
      mockTaskRepository.findById.mockResolvedValue(null);
      
      // Ejecución del método y verificación
      await expect(
        taskService.updateTask('nonexistent', { title: 'New' }, 'user123')
      ).rejects.toThrow(NotFoundError);
      
      // No debe llamar a update
      expect(mockTaskRepository.update).not.toHaveBeenCalled();
      expect(mockEventPublisher.publish).not.toHaveBeenCalled();
    });

    it('debería lanzar AuthorizationError si la tarea pertenece a otro usuario', async () => {
      // Mock de tarea que pertenece a otro usuario
      const existingTask = new Task({
        id: 'task123',
        title: 'Tarea de otro usuario',
        userId: 'otherUser'
      });
      
      // Setup del mock
      mockTaskRepository.findById.mockResolvedValue(existingTask);
      
      // Ejecución del método y verificación
      await expect(
        taskService.updateTask('task123', { title: 'New' }, 'user123')
      ).rejects.toThrow(AuthorizationError);
      
      // No debe llamar a update
      expect(mockTaskRepository.update).not.toHaveBeenCalled();
      expect(mockEventPublisher.publish).not.toHaveBeenCalled();
    });
  });

  describe('deleteTask', () => {
    it('debería eliminar una tarea', async () => {
      // Datos de prueba
      const taskId = 'task123';
      const userId = 'user123';
      
      // Mock de la tarea existente
      const existingTask = new Task({
        id: taskId,
        title: 'Tarea a eliminar',
        userId,
        completed: false
      });
      
      // Setup de los mocks
      mockTaskRepository.findById.mockResolvedValue(existingTask);
      mockTaskRepository.delete.mockResolvedValue(true);
      
      // Ejecución del método
      await taskService.deleteTask(taskId, userId);
      
      // Verificaciones
      expect(mockTaskRepository.findById).toHaveBeenCalledWith(taskId);
      expect(mockTaskRepository.delete).toHaveBeenCalledWith(taskId);
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        'task.deleted',
        expect.objectContaining({
          taskId,
          userId,
          title: existingTask.title
        })
      );
    });

    it('debería lanzar NotFoundError si la tarea no existe', async () => {
      // Setup del mock
      mockTaskRepository.findById.mockResolvedValue(null);
      
      // Ejecución del método y verificación
      await expect(
        taskService.deleteTask('nonexistent', 'user123')
      ).rejects.toThrow(NotFoundError);
      
      // No debe llamar a delete
      expect(mockTaskRepository.delete).not.toHaveBeenCalled();
      expect(mockEventPublisher.publish).not.toHaveBeenCalled();
    });

    it('debería lanzar AuthorizationError si la tarea pertenece a otro usuario', async () => {
      // Mock de tarea que pertenece a otro usuario
      const existingTask = new Task({
        id: 'task123',
        title: 'Tarea de otro usuario',
        userId: 'otherUser'
      });
      
      // Setup del mock
      mockTaskRepository.findById.mockResolvedValue(existingTask);
      
      // Ejecución del método y verificación
      await expect(
        taskService.deleteTask('task123', 'user123')
      ).rejects.toThrow(AuthorizationError);
      
      // No debe llamar a delete
      expect(mockTaskRepository.delete).not.toHaveBeenCalled();
      expect(mockEventPublisher.publish).not.toHaveBeenCalled();
    });
  });

  describe('toggleTaskCompletion', () => {
    it('debería marcar una tarea como completada', async () => {
      // Datos de prueba
      const taskId = 'task123';
      const userId = 'user123';
      
      // Mock de la tarea existente (no completada)
      const existingTask = new Task({
        id: taskId,
        title: 'Tarea pendiente',
        userId,
        completed: false
      });
      
      // Mock de la tarea actualizada (completada)
      const updatedTask = new Task({
        id: taskId,
        title: 'Tarea pendiente',
        userId,
        completed: true
      });
      
      // Setup de los mocks
      mockTaskRepository.findById.mockResolvedValue(existingTask);
      mockTaskRepository.update.mockResolvedValue(updatedTask);
      
      // Ejecución del método
      const result = await taskService.toggleTaskCompletion(taskId, true, userId);
      
      // Verificaciones
      expect(mockTaskRepository.findById).toHaveBeenCalledWith(taskId);
      expect(mockTaskRepository.update).toHaveBeenCalled();
      expect(result).toEqual(updatedTask);
      expect(result.completed).toBe(true);
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        'task.completed',
        expect.objectContaining({
          taskId,
          userId,
          title: existingTask.title
        })
      );
    });

    it('debería marcar una tarea como pendiente', async () => {
      // Datos de prueba
      const taskId = 'task123';
      const userId = 'user123';
      
      // Mock de la tarea existente (completada)
      const existingTask = new Task({
        id: taskId,
        title: 'Tarea completada',
        userId,
        completed: true
      });
      
      // Mock de la tarea actualizada (pendiente)
      const updatedTask = new Task({
        id: taskId,
        title: 'Tarea completada',
        userId,
        completed: false
      });
      
      // Setup de los mocks
      mockTaskRepository.findById.mockResolvedValue(existingTask);
      mockTaskRepository.update.mockResolvedValue(updatedTask);
      
      // Ejecución del método
      const result = await taskService.toggleTaskCompletion(taskId, false, userId);
      
      // Verificaciones
      expect(mockTaskRepository.findById).toHaveBeenCalledWith(taskId);
      expect(mockTaskRepository.update).toHaveBeenCalled();
      expect(result).toEqual(updatedTask);
      expect(result.completed).toBe(false);
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        'task.updated',
        expect.objectContaining({
          taskId,
          userId,
          changes: ['completed']
        })
      );
    });
  });

  describe('getUpcomingTasks', () => {
    it('debería obtener tareas próximas a vencer', async () => {
      // Datos de prueba
      const userId = 'user123';
      const days = 7;
      const mockTasks = [
        { id: 'task1', title: 'Tarea 1', dueDate: new Date('2025-04-05') },
        { id: 'task2', title: 'Tarea 2', dueDate: new Date('2025-04-04') }
      ];
      
      // Setup del mock
      mockTaskRepository.findUpcomingTasks.mockResolvedValue(mockTasks);
      
      // Ejecución del método
      const result = await taskService.getUpcomingTasks(userId, days);
      
      // Verificaciones
      expect(mockTaskRepository.findUpcomingTasks).toHaveBeenCalledWith(userId, days);
      expect(result).toEqual(mockTasks);
      expect(result.length).toBe(2);
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        'task.due_soon',
        expect.objectContaining({
          userId,
          taskCount: 2,
          daysWindow: days
        })
      );
    });

    it('no debería emitir evento si no hay tareas próximas', async () => {
      // Setup del mock
      mockTaskRepository.findUpcomingTasks.mockResolvedValue([]);
      
      // Ejecución del método
      const result = await taskService.getUpcomingTasks('user123', 7);
      
      // Verificaciones
      expect(result).toEqual([]);
      expect(mockEventPublisher.publish).not.toHaveBeenCalled();
    });
  });
});
