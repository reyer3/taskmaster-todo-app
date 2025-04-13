/**
 * Controlador para endpoints de tareas
 * 
 * @module api/tasks/task.controller
 */
const express = require('express');
const router = express.Router();
const { TaskService } = require('../../services/task.service');
const { TaskRepository } = require('../../infrastructure/repositories/task.repository');
const { authMiddleware } = require('../../infrastructure/middlewares/auth.middleware');

// Crear instancias de repositorio y servicio
const taskRepository = new TaskRepository();
const taskService = new TaskService(taskRepository);

/**
 * Obtiene todas las tareas del usuario autenticado
 * 
 * @route GET /api/tasks
 * @param {import('express').Request} req - Objeto de solicitud Express
 * @param {import('express').Response} res - Objeto de respuesta Express
 * @returns {Promise<void>}
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const tasks = await taskService.getUserTasks(req.user.id);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Obtiene tareas próximas a vencer
 * 
 * @route GET /api/tasks/upcoming
 * @param {import('express').Request} req - Objeto de solicitud Express
 * @param {import('express').Response} res - Objeto de respuesta Express
 * @returns {Promise<void>}
 */
router.get('/upcoming', authMiddleware, async (req, res) => {
  try {
    const days = req.query.days ? parseInt(req.query.days) : 7;
    const tasks = await taskService.getUpcomingTasks(req.user.id, days);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Crea una nueva tarea
 * 
 * @route POST /api/tasks
 * @param {import('express').Request} req - Objeto de solicitud Express
 * @param {import('express').Response} res - Objeto de respuesta Express
 * @returns {Promise<void>}
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const taskData = req.body;
    // Obtener timezone desde el body o del usuario en la solicitud
    const timezone = taskData.timezone || req.user.timezone;
    
    delete taskData.timezone; // Eliminamos del objeto de datos para evitar duplicidad
    
    const task = await taskService.createTask(taskData, req.user.id, timezone);
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * Actualiza una tarea existente
 * 
 * @route PUT /api/tasks/:id
 * @param {import('express').Request} req - Objeto de solicitud Express
 * @param {import('express').Response} res - Objeto de respuesta Express
 * @returns {Promise<void>}
 */
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

/**
 * Elimina una tarea
 * 
 * @route DELETE /api/tasks/:id
 * @param {import('express').Request} req - Objeto de solicitud Express
 * @param {import('express').Response} res - Objeto de respuesta Express
 * @returns {Promise<void>}
 */
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

/**
 * Marca una tarea como completada o pendiente
 * 
 * @route PATCH /api/tasks/:id/complete
 * @param {import('express').Request} req - Objeto de solicitud Express
 * @param {import('express').Response} res - Objeto de respuesta Express
 * @returns {Promise<void>}
 */
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

/**
 * Obtiene tareas por rango de fechas
 * 
 * @route GET /api/tasks/by-date-range
 * @param {import('express').Request} req - Objeto de solicitud Express
 * @param {import('express').Response} res - Objeto de respuesta Express
 * @returns {Promise<void>}
 */
router.get('/by-date-range', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Se requieren los parámetros 'startDate' y 'endDate'" });
    }
    
    // Validar formato de fechas
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return res.status(400).json({ message: "Formato de fecha inválido. Use YYYY-MM-DD" });
    }
    
    const tasks = await taskService.getTasksByDateRange(req.user.id, startDate, endDate);
    res.json(tasks);
  } catch (error) {
    console.error('Error en endpoint by-date-range:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;