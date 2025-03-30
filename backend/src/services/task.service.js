/**
 * Servicio para la gestión de tareas (capa de aplicación)
 * Implementa casos de uso relacionados con tareas
 */
const { v4: uuidv4 } = require('uuid');
const { Task } = require('../domain/tasks/task.model');
const { AppError, NotFoundError, AuthorizationError } = require('../utils/errors/app-error');

// Importar el sistema de eventos
const { eventPublisher, eventTypes } = require('../infrastructure/events');
const { TaskEvents } = eventTypes;

class TaskService {
  constructor(taskRepository, config = {}) {
    this.taskRepository = taskRepository;
    this.eventPublisher = config.eventPublisher || eventPublisher;
  }

  /**
   * Obtiene todas las tareas de un usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<Task[]>} Lista de tareas
   */
  async getUserTasks(userId) {
    return this.taskRepository.findAllByUserId(userId);
  }

  /**
   * Crea una nueva tarea
   * @param {Object} taskData - Datos de la tarea
   * @param {string} userId - ID del usuario propietario
   * @returns {Promise<Task>} Tarea creada
   */
  async createTask(taskData, userId) {
    const task = new Task({
      id: uuidv4(),
      title: taskData.title,
      description: taskData.description || '',
      userId,
      dueDate: taskData.dueDate || null,
      priority: taskData.priority || 'none',
      category: taskData.category || 'personal',
      completed: false
    });

    const createdTask = await this.taskRepository.create(task);
    
    // Publicar evento de creación de tarea
    await this.eventPublisher.publish(TaskEvents.CREATED, {
      taskId: createdTask.id,
      userId,
      title: createdTask.title,
      dueDate: createdTask.dueDate,
      priority: createdTask.priority,
      timestamp: new Date().toISOString()
    });

    return createdTask;
  }

  /**
   * Actualiza una tarea existente
   * @param {string} taskId - ID de la tarea
   * @param {Object} updates - Campos a actualizar
   * @param {string} userId - ID del usuario propietario
   * @returns {Promise<Task>} Tarea actualizada
   * @throws {NotFoundError} Si la tarea no existe
   * @throws {AuthorizationError} Si la tarea no pertenece al usuario
   */
  async updateTask(taskId, updates, userId) {
    const task = await this.taskRepository.findById(taskId);

    if (!task) {
      throw new NotFoundError('Tarea no encontrada');
    }

    if (task.userId !== userId) {
      throw new AuthorizationError('No autorizado: La tarea pertenece a otro usuario');
    }

    // Verificar si la tarea se va a marcar como completada
    const markingAsCompleted = !task.completed && updates.completed === true;
    
    // Guardar el estado original para eventos
    const originalTask = {
      title: task.title,
      description: task.description,
      dueDate: task.dueDate,
      priority: task.priority,
      completed: task.completed
    };

    // Actualiza los campos proporcionados
    if (updates.title !== undefined) {
      task.updateTitle(updates.title);
    }

    if (updates.description !== undefined) {
      task.updateDescription(updates.description);
    }

    if (updates.dueDate !== undefined) {
      task.updateDueDate(updates.dueDate);
    }

    if (updates.priority !== undefined) {
      task.updatePriority(updates.priority);
    }

    if (updates.completed !== undefined) {
      updates.completed ? task.markAsCompleted() : task.markAsIncomplete();
    }

    const updatedTask = await this.taskRepository.update(task);

    // Determinar qué evento publicar
    if (markingAsCompleted) {
      // Tarea marcada como completada
      await this.eventPublisher.publish(TaskEvents.COMPLETED, {
        taskId: updatedTask.id,
        userId,
        title: updatedTask.title,
        completedAt: new Date().toISOString()
      });
    } else {
      // Actualización general de tarea
      await this.eventPublisher.publish(TaskEvents.UPDATED, {
        taskId: updatedTask.id,
        userId,
        changes: Object.keys(updates),
        previousState: originalTask,
        currentState: {
          title: updatedTask.title,
          description: updatedTask.description,
          dueDate: updatedTask.dueDate,
          priority: updatedTask.priority,
          completed: updatedTask.completed
        },
        timestamp: new Date().toISOString()
      });
    }

    return updatedTask;
  }

  /**
   * Elimina una tarea
   * @param {string} taskId - ID de la tarea
   * @param {string} userId - ID del usuario propietario
   * @returns {Promise<void>}
   * @throws {NotFoundError} Si la tarea no existe
   * @throws {AuthorizationError} Si la tarea no pertenece al usuario
   */
  async deleteTask(taskId, userId) {
    const task = await this.taskRepository.findById(taskId);

    if (!task) {
      throw new NotFoundError('Tarea no encontrada');
    }

    if (task.userId !== userId) {
      throw new AuthorizationError('No autorizado: La tarea pertenece a otro usuario');
    }

    // Guardar información de la tarea antes de eliminarla
    const taskInfo = {
      taskId: task.id,
      userId,
      title: task.title,
      wasCompleted: task.completed
    };

    await this.taskRepository.delete(taskId);
    
    // Publicar evento de eliminación
    await this.eventPublisher.publish(TaskEvents.DELETED, {
      ...taskInfo,
      deletedAt: new Date().toISOString()
    });
  }

  /**
   * Marca una tarea como completada o pendiente
   * @param {string} taskId - ID de la tarea
   * @param {boolean} completed - Estado de completitud
   * @param {string} userId - ID del usuario propietario
   * @returns {Promise<Task>} Tarea actualizada
   * @throws {NotFoundError} Si la tarea no existe
   * @throws {AuthorizationError} Si la tarea no pertenece al usuario
   */
  async toggleTaskCompletion(taskId, completed, userId) {
    const task = await this.taskRepository.findById(taskId);

    if (!task) {
      throw new NotFoundError('Tarea no encontrada');
    }

    if (task.userId !== userId) {
      throw new AuthorizationError('No autorizado: La tarea pertenece a otro usuario');
    }

    // Verificar si está cambiando a completado
    const markingAsCompleted = !task.completed && completed === true;
    
    completed ? task.markAsCompleted() : task.markAsIncomplete();

    const updatedTask = await this.taskRepository.update(task);
    
    // Si se marcó como completada, publicar evento específico
    if (markingAsCompleted) {
      await this.eventPublisher.publish(TaskEvents.COMPLETED, {
        taskId: updatedTask.id,
        userId,
        title: updatedTask.title,
        completedAt: new Date().toISOString()
      });
    } else {
      // Publicar evento de actualización estándar
      await this.eventPublisher.publish(TaskEvents.UPDATED, {
        taskId: updatedTask.id,
        userId,
        changes: ['completed'],
        currentState: {
          completed: updatedTask.completed
        },
        timestamp: new Date().toISOString()
      });
    }

    return updatedTask;
  }

  /**
   * Obtiene las tareas próximas a vencer
   * @param {string} userId - ID del usuario
   * @param {number} days - Número de días hacia adelante
   * @returns {Promise<Task[]>} Lista de tareas próximas
   */
  async getUpcomingTasks(userId, days = 7) {
    const tasks = await this.taskRepository.findUpcomingTasks(userId, days);
    
    // Si hay tareas próximas, publicar evento
    if (tasks.length > 0) {
      await this.eventPublisher.publish(TaskEvents.DUE_SOON, {
        userId,
        taskCount: tasks.length,
        tasks: tasks.map(task => ({
          taskId: task.id,
          title: task.title,
          dueDate: task.dueDate
        })),
        daysWindow: days,
        timestamp: new Date().toISOString()
      });
    }
    
    return tasks;
  }
}

module.exports = { TaskService };
