/**
 * Pruebas unitarias para el controlador de tareas
 * 
 * @module tests/unit/api/tasks/task.controller.test
 */
const express = require('express');
const request = require('supertest');
const { describe, it, beforeEach, expect } = require('@jest/globals');

// Mocks para servicios
const mockTaskService = {
  getUserTasks: jest.fn(),
  getUpcomingTasks: jest.fn(),
  createTask: jest.fn(),
  updateTask: jest.fn(),
  deleteTask: jest.fn(),
  toggleTaskCompletion: jest.fn()
};

// Mock para el servicio de tareas
jest.mock('../../../../src/services/task.service', () => {
  return {
    TaskService: function() {
      return mockTaskService;
    }
  };
});

// Mock para el middleware de autenticación
jest.mock('../../../../src/infrastructure/middlewares/auth.middleware', () => ({
  authMiddleware: (req, res, next) => {
    req.user = { id: 'test-user-id' };
    next();
  }
}));

// Mock para el repositorio de tareas
jest.mock('../../../../src/infrastructure/repositories/task.repository', () => ({
  TaskRepository: function() {
    return {};
  }
}));

// Importar el controlador real
const taskController = require('../../../../src/api/tasks/task.controller');

describe('Task Controller', () => {
  let app;
  let mockTasks;
  
  beforeEach(() => {
    // Resetear mocks
    jest.clearAllMocks();
    
    // Configurar Express para las pruebas
    app = express();
    app.use(express.json());
    
    // Montar el controlador
    app.use('/api/tasks', taskController);
    
    // Configurar datos de ejemplo
    mockTasks = [
      {
        id: 'task-1',
        title: 'Task 1',
        description: 'Description 1',
        completed: false,
        userId: 'test-user-id',
        dueDate: '2025-04-15T00:00:00.000Z',
        category: 'work',
        priority: 'high'
      },
      {
        id: 'task-2',
        title: 'Task 2',
        description: 'Description 2',
        completed: true,
        userId: 'test-user-id',
        dueDate: null,
        category: 'personal',
        priority: 'low'
      }
    ];
    
    // Configurar respuestas de los métodos mock
    mockTaskService.getUserTasks.mockResolvedValue(mockTasks);
    mockTaskService.getUpcomingTasks.mockResolvedValue([mockTasks[0]]);
    mockTaskService.createTask.mockImplementation((data, userId) => 
      Promise.resolve({ ...data, id: 'new-task-id', userId }));
    mockTaskService.updateTask.mockImplementation((id, updates, userId) =>
      Promise.resolve({ ...mockTasks.find(t => t.id === id), ...updates }));
    mockTaskService.deleteTask.mockResolvedValue(undefined);
    mockTaskService.toggleTaskCompletion.mockImplementation((id, completed, userId) => 
      Promise.resolve({ ...mockTasks.find(t => t.id === id), completed }));
    
    // Middleware de manejo de errores
    app.use((err, req, res, next) => {
      res.status(err.statusCode || 500).json({
        status: 'error',
        message: err.message
      });
    });
  });

  describe('GET /', () => {
    it('debería obtener todas las tareas del usuario autenticado', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(mockTaskService.getUserTasks).toHaveBeenCalledWith('test-user-id');
      expect(response.body).toEqual(mockTasks);
    });
    
    it('debería manejar errores en obtener tareas', async () => {
      mockTaskService.getUserTasks.mockRejectedValue(new Error('Error getting tasks'));
      
      const response = await request(app)
        .get('/api/tasks')
        .expect('Content-Type', /json/)
        .expect(500);
      
      expect(response.body).toHaveProperty('message', 'Error getting tasks');
    });
  });
  
  describe('GET /upcoming', () => {
    it('debería obtener tareas próximas a vencer', async () => {
      const response = await request(app)
        .get('/api/tasks/upcoming?days=5')
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(mockTaskService.getUpcomingTasks).toHaveBeenCalledWith('test-user-id', 5);
      expect(response.body).toEqual([mockTasks[0]]);
    });
    
    it('debería usar valor predeterminado de 7 días si no se especifica', async () => {
      const response = await request(app)
        .get('/api/tasks/upcoming')
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(mockTaskService.getUpcomingTasks).toHaveBeenCalledWith('test-user-id', 7);
    });
  });
  
  describe('POST /', () => {
    it('debería crear una nueva tarea', async () => {
      const newTask = {
        title: 'New Task',
        description: 'New Description',
        dueDate: '2025-04-30',
        category: 'work',
        priority: 'medium'
      };
      
      const response = await request(app)
        .post('/api/tasks')
        .send(newTask)
        .expect('Content-Type', /json/)
        .expect(201);
      
      expect(mockTaskService.createTask).toHaveBeenCalledWith(newTask, 'test-user-id');
      expect(response.body).toEqual({
        ...newTask,
        id: 'new-task-id',
        userId: 'test-user-id'
      });
    });
    
    it('debería manejar errores de validación', async () => {
      mockTaskService.createTask.mockRejectedValue(new Error('Title is required'));
      
      const response = await request(app)
        .post('/api/tasks')
        .send({})
        .expect('Content-Type', /json/)
        .expect(400);
      
      expect(response.body).toHaveProperty('message', 'Title is required');
    });
  });
  
  describe('PUT /:id', () => {
    it('debería actualizar una tarea existente', async () => {
      const updates = { 
        title: 'Updated Title', 
        priority: 'low' 
      };
      
      const response = await request(app)
        .put('/api/tasks/task-1')
        .send(updates)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(mockTaskService.updateTask).toHaveBeenCalledWith('task-1', updates, 'test-user-id');
      expect(response.body).toHaveProperty('title', 'Updated Title');
      expect(response.body).toHaveProperty('priority', 'low');
    });
    
    it('debería manejar el caso de tarea no encontrada', async () => {
      mockTaskService.updateTask.mockRejectedValue(new Error('Task not found'));
      
      const response = await request(app)
        .put('/api/tasks/non-existent')
        .send({ title: 'Updated Title' })
        .expect('Content-Type', /json/)
        .expect(404);
      
      expect(response.body).toHaveProperty('message', 'Task not found');
    });
    
    it('debería manejar el caso de tarea de otro usuario', async () => {
      mockTaskService.updateTask.mockRejectedValue(new Error('Unauthorized access to task'));
      
      const response = await request(app)
        .put('/api/tasks/task-other-user')
        .send({ title: 'Updated Title' })
        .expect('Content-Type', /json/)
        .expect(403);
      
      expect(response.body).toHaveProperty('message', 'Unauthorized access to task');
    });
  });
  
  describe('DELETE /:id', () => {
    it('debería eliminar una tarea existente', async () => {
      const response = await request(app)
        .delete('/api/tasks/task-1')
        .expect(204);
      
      expect(mockTaskService.deleteTask).toHaveBeenCalledWith('task-1', 'test-user-id');
    });
    
    it('debería manejar el caso de tarea no encontrada', async () => {
      mockTaskService.deleteTask.mockRejectedValue(new Error('Task not found'));
      
      const response = await request(app)
        .delete('/api/tasks/non-existent')
        .expect('Content-Type', /json/)
        .expect(404);
      
      expect(response.body).toHaveProperty('message', 'Task not found');
    });
  });
  
  describe('PATCH /:id/complete', () => {
    it('debería marcar una tarea como completada', async () => {
      const response = await request(app)
        .patch('/api/tasks/task-1/complete')
        .send({ completed: true })
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(mockTaskService.toggleTaskCompletion).toHaveBeenCalledWith('task-1', true, 'test-user-id');
      expect(response.body).toHaveProperty('completed', true);
    });
    
    it('debería validar que el campo completed esté presente', async () => {
      const response = await request(app)
        .patch('/api/tasks/task-1/complete')
        .send({})
        .expect('Content-Type', /json/)
        .expect(400);
      
      expect(response.body).toHaveProperty('message');
      expect(mockTaskService.toggleTaskCompletion).not.toHaveBeenCalled();
    });
    
    it('debería manejar el caso de tarea no encontrada', async () => {
      mockTaskService.toggleTaskCompletion.mockRejectedValue(new Error('Task not found'));
      
      const response = await request(app)
        .patch('/api/tasks/non-existent/complete')
        .send({ completed: true })
        .expect('Content-Type', /json/)
        .expect(404);
      
      expect(response.body).toHaveProperty('message', 'Task not found');
    });
  });
});
