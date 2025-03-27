/**
 * Modelo de dominio para Tarea
 * 
 * Este modelo encapsula la lógica de negocio relacionada con las tareas
 * y sigue el principio de "Tell, Don't Ask"
 */

/**
 * Modelo de dominio para una tarea
 */
class Task {
  /**
   * Constructor de tarea
   * 
   * @param {Object} data - Datos de la tarea
   * @param {number} data.id - ID único de la tarea
   * @param {string} data.title - Título de la tarea
   * @param {string} data.description - Descripción de la tarea (opcional)
   * @param {boolean} data.completed - Estado de completitud
   * @param {string} data.category - Categoría de la tarea
   * @param {Date} data.dueDate - Fecha de vencimiento (opcional)
   * @param {number} data.userId - ID del usuario propietario
   * @param {Date} data.createdAt - Fecha de creación
   * @param {Date} data.updatedAt - Fecha de última actualización
   */
  constructor(data) {
    this.id = data.id;
    this.title = data.title;
    this.description = data.description || '';
    this.completed = data.completed || false;
    this.category = data.category || 'personal';
    this.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    this.userId = data.userId;
    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
    this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
    
    this.validate();
  }

  /**
   * Valida que la tarea tenga los datos requeridos
   * @throws {Error} Si la validación falla
   */
  validate() {
    if (!this.title || this.title.trim().length === 0) {
      throw new Error('El título de la tarea es obligatorio');
    }
    
    if (!this.userId) {
      throw new Error('La tarea debe pertenecer a un usuario');
    }

    if (this.dueDate && this.dueDate < new Date(new Date().setHours(0, 0, 0, 0))) {
      throw new Error('La fecha de vencimiento no puede ser en el pasado');
    }
  }

  /**
   * Marca la tarea como completada
   * @returns {Task} La instancia actual para encadenamiento
   */
  complete() {
    this.completed = true;
    this.updatedAt = new Date();
    return this;
  }

  /**
   * Marca la tarea como pendiente
   * @returns {Task} La instancia actual para encadenamiento
   */
  incomplete() {
    this.completed = false;
    this.updatedAt = new Date();
    return this;
  }

  /**
   * Actualiza los datos de la tarea
   * 
   * @param {Object} data - Datos a actualizar
   * @param {string} data.title - Nuevo título
   * @param {string} data.description - Nueva descripción
   * @param {boolean} data.completed - Nuevo estado
   * @param {string} data.category - Nueva categoría
   * @param {Date} data.dueDate - Nueva fecha de vencimiento
   * @returns {Task} La instancia actual para encadenamiento
   */
  update(data) {
    if (data.title !== undefined) this.title = data.title;
    if (data.description !== undefined) this.description = data.description;
    if (data.completed !== undefined) this.completed = data.completed;
    if (data.category !== undefined) this.category = data.category;
    if (data.dueDate !== undefined) this.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    
    this.updatedAt = new Date();
    this.validate();
    
    return this;
  }

  /**
   * Verifica si la tarea está vencida
   * @returns {boolean} true si la tarea está vencida
   */
  isOverdue() {
    if (!this.dueDate || this.completed) return false;
    return this.dueDate < new Date();
  }

  /**
   * Convierte la instancia a un objeto plano
   * @returns {Object} Representación de la tarea como objeto
   */
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      completed: this.completed,
      category: this.category,
      dueDate: this.dueDate,
      userId: this.userId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      isOverdue: this.isOverdue(),
    };
  }

  /**
   * Crea una instancia de Task a partir de un objeto
   * 
   * @param {Object} data - Datos para crear la tarea
   * @returns {Task} Una nueva instancia de Task
   */
  static create(data) {
    return new Task(data);
  }
}

module.exports = Task;
