/**
 * Controlador para endpoints de tareas
 */
const express = require('express');
const router = express.Router();
const { TaskService } = require('../../services/TaskService');
const { TaskRepository } = require('../../infrastructure/repositories/TaskRepository');
const { authMiddleware } = require('../../infrastructure/middlewares/authMiddleware');

// Crear instancias de repositorio y servicio
const taskRepository = new TaskRepository();
const taskService = new TaskService(taskRepository);

// Obtener todas las tareas del usuario autenticado
router.get('/', authMiddleware, async (req, res) => {
  try {
    const tasks = await taskService.getUserTasks(req.user.id);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtener tareas próximas a vencer
router.get('/upcoming', authMiddleware, async (req, res) => {
  try {
    const days = req.query.days ? parseInt(req.query.days) : 7;
    const tasks = await taskService.getUpcomingTasks(req.user.id, days);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Crear una nueva tarea
router.post('/', authMiddleware, async (req, res) => {
  try {
    const taskData = req.body;
    const task = await taskService.createTask(taskData, req.user.id);
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Actualizar una tarea existente
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const taskId = req.params.id;
    const updates = req.body;
    const task = await taskService.updateTask(taskId, updates, req.user.id);
    res.json(task);
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({ message: error.message });
    }
    res.status(400).json({ message: error.message });
  }
});

// Eliminar una tarea
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const taskId = req.params.id;
    await taskService.deleteTask(taskId, req.user.id);
    res.status(204).end();
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
});

// Marcar una tarea como completada o pendiente
router.patch('/:id/complete', authMiddleware, async (req, res) => {
  try {
    const taskId = req.params.id;
    const { completed } = req.body;
    
    if (completed === undefined) {
      return res.status(400).json({ message: "'completed' field is required" });
    }
    
    const task = await taskService.toggleTaskCompletion(
      taskId,
      completed,
      req.user.id
    );
    
    res.json(task);
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({ message: error.message });
    }
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
