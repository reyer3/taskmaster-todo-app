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
   * @param {string} data.timezone - Zona horaria del usuario (opcional)
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
    this.timezone = data.timezone || 'UTC';

    this.validate(this.timezone);
  }

  /**
   * Valida que una fecha no sea anterior a hoy
   * @param {Date|string} date - Fecha a validar
   * @param {string} timezone - Zona horaria del usuario (por defecto 'UTC')
   * @throws {Error} Si la fecha es anterior a hoy
   * @private
   */
  _validateDueDate(date, timezone = 'UTC') {
    if (!date) return; // Si no hay fecha, no validamos

    // Obtener la fecha actual en la zona horaria del usuario
    const today = new Date();
    let todayInUserTimezone;
    
    try {
      // Crear "hoy" en la zona horaria del usuario
      todayInUserTimezone = new Date(today.toLocaleString('en-US', { timeZone: timezone }));
    } catch (error) {
      // Si hay error con la zona horaria proporcionada, usar UTC
      console.warn(`Zona horaria inválida: ${timezone}, usando UTC como respaldo`);
      todayInUserTimezone = new Date(today.toLocaleString('en-US', { timeZone: 'UTC' }));
    }
    
    const todayStr = todayInUserTimezone.toISOString().split('T')[0]; // YYYY-MM-DD
    
    const dueDateObj = new Date(date);
    const dueDateStr = dueDateObj.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Comparar solo las fechas sin hora
    // Nota: La comparación permite fechas del día actual (dueDateStr == todayStr)
    if (dueDateStr < todayStr) {
      throw new Error('La fecha de vencimiento no puede ser en el pasado');
    }
  }

  /**
   * Valida que la tarea tenga los datos requeridos
   * @param {string} timezone - Zona horaria del usuario (opcional)
   * @throws {Error} Si la validación falla
   */
  validate(timezone = 'UTC') {
    this._validateTitle(this.title);
    this._validateId(this.id);
    this._validateUserId(this.userId);

    if (this.dueDate) {
      this._validateDueDate(this.dueDate, timezone);
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
      throw new Error('El título de la tarea no puede estar vacío');
    }

    if (title.length > 100) {
      throw new Error('El título no puede exceder los 100 caracteres');
    }
  }

  /**
   * Valida que el ID sea válido
   * @param {string} id - ID a validar
   * @throws {Error} Si el ID no es válido
   * @private
   */
  _validateId(id) {
    if (!id || id.trim().length === 0) {
      throw new Error('El ID de la tarea no puede estar vacío');
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
      throw new Error('El ID de usuario no puede estar vacío');
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
    if (priority && !validPriorities.includes(priority)) {
      throw new Error('Prioridad inválida');
    }
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
   * Marca la tarea como completada (alias para complete)
   * @returns {Task} La instancia actual para encadenamiento
   */
  markAsCompleted() {
    if (!this.completed) {
      this.completed = true;
      this.updatedAt = new Date();
    }
    return this;
  }

  /**
   * Marca la tarea como incompleta (alias para incomplete)
   * @returns {Task} La instancia actual para encadenamiento
   */
  markAsIncomplete() {
    if (this.completed) {
      this.completed = false;
      this.updatedAt = new Date();
    }
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
    const validCategories = ['personal', 'trabajo', 'estudio', 'salud', 'finanzas', 'otros'];
    if (newCategory && !validCategories.includes(newCategory)) {
      throw new Error('Categoría inválida');
    }
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
   * @param {string} timezone - Zona horaria del usuario (opcional)
   * @returns {Task} La instancia actual para encadenamiento
   */
  updateDueDate(newDueDate, timezone = null) {
    if (newDueDate !== null && !(newDueDate instanceof Date) && isNaN(new Date(newDueDate).getTime())) {
      throw new Error('La fecha de vencimiento debe ser una fecha válida o null');
    }
    
    if (newDueDate) {
      this._validateDueDate(newDueDate, timezone || this.timezone);
    }
    
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
   * @param {string} data.timezone - Zona horaria del usuario (opcional)
   * @returns {Task} La instancia actual para encadenamiento
   */
  update(data) {
    const timezone = data.timezone || this.timezone;
    
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
      if (data.dueDate) {
        this._validateDueDate(data.dueDate, timezone);
        this.dueDate = new Date(data.dueDate);
      } else {
        this.dueDate = null;
      }
    }
    
    // Actualizar la zona horaria si se proporcionó
    if (data.timezone) {
      this.timezone = data.timezone;
    }

    this.updatedAt = new Date();
    this.validate(timezone);

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
      userId: this.userId
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

module.exports = { Task };