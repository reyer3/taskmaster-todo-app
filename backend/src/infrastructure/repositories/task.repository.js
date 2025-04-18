/**
 * Implementación de repositorio para Tareas
 */
const { prisma } = require('../database/prisma-client');
const { Task } = require('../../domain/tasks/task.model');

class TaskRepository {
  /**
   * Encuentra todas las tareas de un usuario
   * @param {string} userId - ID del usuario propietario
   * @returns {Promise<Task[]>} Array de objetos Task
   */
  async findAllByUserId(userId) {
    const tasks = await prisma.task.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return tasks.map(task => new Task(task));
  }

  /**
   * Encuentra una tarea por su ID
   * @param {string} id - ID de la tarea
   * @returns {Promise<Task|null>} Objeto Task o null si no existe
   */
  async findById(id) {
    const task = await prisma.task.findUnique({
      where: { id }
    });

    if (!task) return null;

    return new Task(task);
  }

  /**
   * Crea una nueva tarea
   * @param {Task} task - Objeto Task a crear
   * @returns {Promise<Task>} Tarea creada
   */
  async create(task) {
    const created = await prisma.task.create({
      data: task.toJSON()
    });

    return new Task(created);
  }

  /**
   * Actualiza una tarea existente
   * @param {Task} task - Objeto Task con datos actualizados
   * @returns {Promise<Task>} Tarea actualizada
   */
  async update(task) {
    const updated = await prisma.task.update({
      where: { id: task.id },
      data: task.toJSON()
    });

    return new Task(updated);
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
    return true;
  }

  /**
   * Encuentra tareas pendientes con fecha de vencimiento próxima
   * @param {string} userId - ID del usuario propietario
   * @param {number} daysAhead - Días hacia adelante para buscar
   * @returns {Promise<Task[]>} Array de objetos Task
   */
  async findUpcomingTasks(userId, daysAhead = 7) {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + daysAhead);

    const tasks = await prisma.task.findMany({
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

    return tasks.map(task => new Task(task));
  }

  /**
   * Busca tareas por un rango de fechas
   * 
   * @param {string} userId - ID del usuario
   * @param {Date} startDate - Fecha de inicio
   * @param {Date} endDate - Fecha de fin
   * @returns {Promise<Array>} Lista de tareas
   */
  async findByDateRange(userId, startDate, endDate) {
    try {
      // Convertir a ISOString para comparación en la base de datos
      const startIso = startDate.toISOString();
      const endIso = endDate.toISOString();
      
      // Filtrar por userId y dueDate entre las fechas dadas
      const tasks = await prisma.task.findMany({
        where: {
          userId: userId,
          dueDate: {
            not: null,
            gte: startIso,
            lte: endIso
          }
        },
        orderBy: {
          dueDate: 'asc'
        }
      });
      
      return tasks.map(task => new Task(task));
    } catch (error) {
      console.error('Error al buscar tareas por rango de fechas:', error);
      throw new Error('Error al buscar tareas por rango de fechas');
    }
  }
}

module.exports = { TaskRepository };
