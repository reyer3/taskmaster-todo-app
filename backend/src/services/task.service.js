/**
 * Servicio para la gestión de tareas (capa de aplicación)
 * Implementa casos de uso relacionados con tareas
 */
const { v4: uuidv4 } = require('uuid');

class TaskService {
  constructor(taskRepository) {
    this.taskRepository = taskRepository;
  }
  
  /**
   * Obtiene todas las tareas de un usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<Array>} Lista de tareas
   */
  async getUserTasks(userId) {
    return this.taskRepository.findAllByUserId(userId);
  }
  
  /**
   * Crea una nueva tarea
   * @param {Object} taskData - Datos de la tarea
   * @param {string} userId - ID del usuario propietario
   * @returns {Promise<Object>} Tarea creada
   */
  async createTask(taskData, userId) {
    const newTask = {
      id: uuidv4(),
      title: taskData.title,
      description: taskData.description || '',
      userId,
      dueDate: taskData.dueDate || null,
      priority: taskData.priority || 'none',
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Validar el título
    if (!newTask.title || newTask.title.trim() === "") {
      throw new Error("Task title cannot be empty");
    }
    
    return this.taskRepository.create(newTask);
  }
  
  /**
   * Actualiza una tarea existente
   * @param {string} taskId - ID de la tarea
   * @param {Object} updates - Campos a actualizar
   * @param {string} userId - ID del usuario propietario
   * @returns {Promise<Object>} Tarea actualizada
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
    
    const updatedTask = { ...task, updatedAt: new Date() };
    
    // Actualiza los campos proporcionados
    if (updates.title !== undefined) {
      if (!updates.title || updates.title.trim() === "") {
        throw new Error("Task title cannot be empty");
      }
      updatedTask.title = updates.title;
    }
    
    if (updates.description !== undefined) {
      updatedTask.description = updates.description || '';
    }
    
    if (updates.dueDate !== undefined) {
      updatedTask.dueDate = updates.dueDate;
    }
    
    if (updates.priority !== undefined) {
      const validPriorities = ["none", "low", "medium", "high"];
      updatedTask.priority = validPriorities.includes(updates.priority) 
        ? updates.priority 
        : "none";
    }
    
    if (updates.completed !== undefined) {
      updatedTask.completed = !!updates.completed;
    }
    
    return this.taskRepository.update(updatedTask);
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
   * @returns {Promise<Object>} Tarea actualizada
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
    
    const updatedTask = { 
      ...task, 
      completed: !!completed,
      updatedAt: new Date() 
    };
    
    return this.taskRepository.update(updatedTask);
  }
  
  /**
   * Obtiene las tareas próximas a vencer
   * @param {string} userId - ID del usuario
   * @param {number} days - Número de días hacia adelante
   * @returns {Promise<Array>} Lista de tareas próximas
   */
  async getUpcomingTasks(userId, days = 7) {
    return this.taskRepository.findUpcomingTasks(userId, days);
  }
}

module.exports = { TaskService };
