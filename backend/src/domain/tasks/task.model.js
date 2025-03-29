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
   * @param {string} data.id - ID único de la tarea
   * @param {string} data.title - Título de la tarea
   * @param {string} data.description - Descripción de la tarea (opcional)
   * @param {boolean} data.completed - Estado de completitud
   * @param {string} data.category - Categoría de la tarea (opcional)
   * @param {string} data.priority - Prioridad de la tarea (none, low, medium, high)
   * @param {Date|string} data.dueDate - Fecha de vencimiento (opcional)
   * @param {string} data.userId - ID del usuario propietario
   * @param {Date|string} data.createdAt - Fecha de creación
   * @param {Date|string} data.updatedAt - Fecha de última actualización
   */
  constructor(data) {
    this.id = data.id;
    this.title = data.title;
    this.description = data.description || '';
    this.completed = data.completed || false;
    this.category = data.category || 'personal';
    this.priority = this._validatePriority(data.priority || 'none');
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
    this._validateTitle(this.title);
    this._validateUserId(this.userId);

    if (this.dueDate && this.dueDate < new Date(new Date().setHours(0, 0, 0, 0))) {
      throw new Error('La fecha de vencimiento no puede ser en el pasado');
    }
  }

  /**
   * Valida que el título sea válido
   * @param {string} title - Título a validar
   * @throws {Error} Si el título no es válido
   * @private
   */
  _validateTitle(title) {
    if (!title || title.trim().length === 0) {
      throw new Error('El título de la tarea es obligatorio');
    }

    if (title.length > 100) {
      throw new Error('El título no puede exceder los 100 caracteres');
    }
  }

  /**
   * Valida que el userId sea válido
   * @param {string} userId - Id de usuario a validar
   * @throws {Error} Si el userId no es válido
   * @private
   */
  _validateUserId(userId) {
    if (!userId) {
      throw new Error('La tarea debe pertenecer a un usuario');
    }
  }

  /**
   * Valida y normaliza la prioridad
   * @param {string} priority - Prioridad a validar
   * @returns {string} - Prioridad normalizada
   * @private
   */
  _validatePriority(priority) {
    const validPriorities = ['none', 'low', 'medium', 'high'];
    return validPriorities.includes(priority) ? priority : 'none';
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
   * Actualiza el título de la tarea
   * @param {string} newTitle - Nuevo título
   * @returns {Task} La instancia actual para encadenamiento
   */
  updateTitle(newTitle) {
    this._validateTitle(newTitle);
    this.title = newTitle;
    this.updatedAt = new Date();
    return this;
  }

  /**
   * Actualiza la descripción de la tarea
   * @param {string} newDescription - Nueva descripción
   * @returns {Task} La instancia actual para encadenamiento
   */
  updateDescription(newDescription) {
    this.description = newDescription || '';
    this.updatedAt = new Date();
    return this;
  }

  /**
   * Actualiza la categoría de la tarea
   * @param {string} newCategory - Nueva categoría
   * @returns {Task} La instancia actual para encadenamiento
   */
  updateCategory(newCategory) {
    this.category = newCategory || 'personal';
    this.updatedAt = new Date();
    return this;
  }

  /**
   * Actualiza la prioridad de la tarea
   * @param {string} newPriority - Nueva prioridad
   * @returns {Task} La instancia actual para encadenamiento
   */
  updatePriority(newPriority) {
    this.priority = this._validatePriority(newPriority);
    this.updatedAt = new Date();
    return this;
  }

  /**
   * Actualiza la fecha de vencimiento de la tarea
   * @param {Date|string} newDueDate - Nueva fecha de vencimiento
   * @returns {Task} La instancia actual para encadenamiento
   */
  updateDueDate(newDueDate) {
    this.dueDate = newDueDate ? new Date(newDueDate) : null;
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
   * @param {string} data.priority - Nueva prioridad
   * @param {Date|string} data.dueDate - Nueva fecha de vencimiento
   * @returns {Task} La instancia actual para encadenamiento
   */
  update(data) {
    if (data.title !== undefined) {
      this._validateTitle(data.title);
      this.title = data.title;
    }

    if (data.description !== undefined) {
      this.description = data.description || '';
    }

    if (data.completed !== undefined) {
      this.completed = !!data.completed;
    }

    if (data.category !== undefined) {
      this.category = data.category || 'personal';
    }

    if (data.priority !== undefined) {
      this.priority = this._validatePriority(data.priority);
    }

    if (data.dueDate !== undefined) {
      this.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    }

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
      priority: this.priority,
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