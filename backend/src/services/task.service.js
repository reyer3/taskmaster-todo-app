/**
 * Servicio para la gestión de tareas (capa de aplicación)
 * Implementa casos de uso relacionados con tareas
 */
const { v4: uuidv4 } = require('uuid');
const { Task } = require('../domain/tasks/task.model');

class TaskService {
  constructor(taskRepository) {
    this.taskRepository = taskRepository;
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
      completed: false
    });

    return this.taskRepository.create(task);
  }

  /**
   * Actualiza una tarea existente
   * @param {string} taskId - ID de la tarea
   * @param {Object} updates - Campos a actualizar
   * @param {string} userId - ID del usuario propietario
   * @returns {Promise<Task>} Tarea actualizada
   * @throws {Error} Si la tarea no existe o no pertenece al usuario
   */
  async updateTask(taskId, updates, userId) {
    const task = await this.taskRepository.findById(taskId);

    if (!task) {
      throw new Error('Task not found');
    }

    if (task.userId !== userId) {
      throw new Error('Unauthorized: Task belongs to another user');
    }

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

    return this.taskRepository.update(task);
  }

  /**
   * Elimina una tarea
   * @param {string} taskId - ID de la tarea
   * @param {string} userId - ID del usuario propietario
   * @returns {Promise<void>}
   * @throws {Error} Si la tarea no existe o no pertenece al usuario
   */
  async deleteTask(taskId, userId) {
    const task = await this.taskRepository.findById(taskId);

    if (!task) {
      throw new Error('Task not found');
    }

    if (task.userId !== userId) {
      throw new Error('Unauthorized: Task belongs to another user');
    }

    await this.taskRepository.delete(taskId);
  }

  /**
   * Marca una tarea como completada o pendiente
   * @param {string} taskId - ID de la tarea
   * @param {boolean} completed - Estado de completitud
   * @param {string} userId - ID del usuario propietario
   * @returns {Promise<Task>} Tarea actualizada
   * @throws {Error} Si la tarea no existe o no pertenece al usuario
   */
  async toggleTaskCompletion(taskId, completed, userId) {
    const task = await this.taskRepository.findById(taskId);

    if (!task) {
      throw new Error('Task not found');
    }

    if (task.userId !== userId) {
      throw new Error('Unauthorized: Task belongs to another user');
    }

    completed ? task.markAsCompleted() : task.markAsIncomplete();

    return this.taskRepository.update(task);
  }

  /**
   * Obtiene las tareas próximas a vencer
   * @param {string} userId - ID del usuario
   * @param {number} days - Número de días hacia adelante
   * @returns {Promise<Task[]>} Lista de tareas próximas
   */
  async getUpcomingTasks(userId, days = 7) {
    return this.taskRepository.findUpcomingTasks(userId, days);
  }
}

module.exports = { TaskService };
