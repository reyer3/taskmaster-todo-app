/**
 * Implementación de repositorio para Tareas
 */
const { prisma } = require('../database/prisma-client');

class TaskRepository {
  /**
   * Encuentra todas las tareas de un usuario
   * @param {string} userId - ID del usuario propietario
   * @returns {Promise<Array>} Array de objetos Task
   */
  async findAllByUserId(userId) {
    return prisma.task.findMany({
      where: { userId }
    });
  }
  
  /**
   * Encuentra una tarea por su ID
   * @param {string} id - ID de la tarea
   * @returns {Promise<Object|null>} Objeto Task o null si no existe
   */
  async findById(id) {
    return prisma.task.findUnique({
      where: { id }
    });
  }
  
  /**
   * Crea una nueva tarea
   * @param {Object} task - Objeto Task a crear
   * @returns {Promise<Object>} Tarea creada
   */
  async create(task) {
    return prisma.task.create({
      data: task
    });
  }
  
  /**
   * Actualiza una tarea existente
   * @param {Object} task - Objeto Task con datos actualizados
   * @returns {Promise<Object>} Tarea actualizada
   */
  async update(task) {
    const { id, ...data } = task;
    
    return prisma.task.update({
      where: { id },
      data
    });
  }
  
  /**
   * Elimina una tarea por su ID
   * @param {string} id - ID de la tarea a eliminar
   * @returns {Promise<void>}
   */
  async delete(id) {
    await prisma.task.delete({
      where: { id }
    });
  }
  
  /**
   * Encuentra tareas pendientes con fecha de vencimiento próxima
   * @param {string} userId - ID del usuario propietario
   * @param {number} daysAhead - Días hacia adelante para buscar
   * @returns {Promise<Array>} Array de objetos Task
   */
  async findUpcomingTasks(userId, daysAhead = 7) {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + daysAhead);
    
    return prisma.task.findMany({
      where: {
        userId,
        completed: false,
        dueDate: {
          gte: today,
          lte: futureDate
        }
      },
      orderBy: {
        dueDate: 'asc'
      }
    });
  }
}

module.exports = { TaskRepository };
