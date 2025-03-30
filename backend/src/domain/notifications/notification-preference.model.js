/**
 * Modelo de dominio para preferencias de notificaciones
 * 
 * Representa las preferencias de notificaciones de un usuario.
 */

class NotificationPreference {
  constructor(data) {
    this.id = data.id;
    this.userId = data.userId;
    
    // Email
    this.emailEnabled = data.emailEnabled !== undefined ? data.emailEnabled : true;
    this.emailTaskCreated = data.emailTaskCreated !== undefined ? data.emailTaskCreated : true;
    this.emailTaskDueSoon = data.emailTaskDueSoon !== undefined ? data.emailTaskDueSoon : true;
    this.emailTaskCompleted = data.emailTaskCompleted !== undefined ? data.emailTaskCompleted : false;
    
    // Push/WebSocket
    this.pushEnabled = data.pushEnabled !== undefined ? data.pushEnabled : true;
    this.pushTaskCreated = data.pushTaskCreated !== undefined ? data.pushTaskCreated : true;
    this.pushTaskUpdated = data.pushTaskUpdated !== undefined ? data.pushTaskUpdated : true;
    this.pushTaskCompleted = data.pushTaskCompleted !== undefined ? data.pushTaskCompleted : true;
    this.pushTaskDeleted = data.pushTaskDeleted !== undefined ? data.pushTaskDeleted : false;
    this.pushTaskDueSoon = data.pushTaskDueSoon !== undefined ? data.pushTaskDueSoon : true;
    
    // Configuración general
    this.dailyDigest = data.dailyDigest !== undefined ? data.dailyDigest : false;
    this.weeklyDigest = data.weeklyDigest !== undefined ? data.weeklyDigest : true;
    
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  /**
   * Actualiza las preferencias de notificaciones
   * @param {Object} updates - Campos a actualizar
   * @returns {NotificationPreference} Instancia actualizada
   */
  update(updates) {
    // Actualizar solo campos válidos
    Object.keys(updates).forEach(key => {
      if (this.hasOwnProperty(key) && key !== 'id' && key !== 'userId' && 
          key !== 'createdAt' && key !== 'updatedAt') {
        this[key] = updates[key];
      }
    });
    
    this.updatedAt = new Date();
    return this;
  }

  /**
   * Habilita o deshabilita todas las notificaciones por email
   * @param {boolean} enabled - Estado habilitado/deshabilitado
   * @returns {NotificationPreference} Instancia actualizada
   */
  setEmailEnabled(enabled) {
    this.emailEnabled = !!enabled;
    return this;
  }

  /**
   * Habilita o deshabilita todas las notificaciones push
   * @param {boolean} enabled - Estado habilitado/deshabilitado
   * @returns {NotificationPreference} Instancia actualizada
   */
  setPushEnabled(enabled) {
    this.pushEnabled = !!enabled;
    return this;
  }

  /**
   * Verifica si un tipo de notificación por email está habilitada
   * @param {string} eventType - Tipo de evento
   * @returns {boolean} true si está habilitada
   */
  isEmailEnabledForEvent(eventType) {
    if (!this.emailEnabled) return false;
    
    switch (eventType) {
      case 'task.created':
        return this.emailTaskCreated;
      case 'task.due_soon':
        return this.emailTaskDueSoon;
      case 'task.completed':
        return this.emailTaskCompleted;
      default:
        return false; // Por defecto, tipos no especificados están deshabilitados
    }
  }

  /**
   * Verifica si un tipo de notificación push está habilitada
   * @param {string} eventType - Tipo de evento
   * @returns {boolean} true si está habilitada
   */
  isPushEnabledForEvent(eventType) {
    if (!this.pushEnabled) return false;
    
    switch (eventType) {
      case 'task.created':
        return this.pushTaskCreated;
      case 'task.updated':
        return this.pushTaskUpdated;
      case 'task.completed':
        return this.pushTaskCompleted;
      case 'task.deleted':
        return this.pushTaskDeleted;
      case 'task.due_soon':
        return this.pushTaskDueSoon;
      default:
        return true; // Por defecto, otros tipos están habilitados si el push general lo está
    }
  }

  /**
   * Crea una representación simple para enviar al cliente
   * @returns {Object} Objeto simplificado
   */
  toDTO() {
    return {
      id: this.id,
      userId: this.userId,
      email: {
        enabled: this.emailEnabled,
        taskCreated: this.emailTaskCreated,
        taskDueSoon: this.emailTaskDueSoon,
        taskCompleted: this.emailTaskCompleted
      },
      push: {
        enabled: this.pushEnabled,
        taskCreated: this.pushTaskCreated,
        taskUpdated: this.pushTaskUpdated,
        taskCompleted: this.pushTaskCompleted,
        taskDeleted: this.pushTaskDeleted,
        taskDueSoon: this.pushTaskDueSoon
      },
      digests: {
        daily: this.dailyDigest,
        weekly: this.weeklyDigest
      }
    };
  }

  /**
   * Crea preferencias por defecto para un usuario
   * @param {string} userId - ID del usuario
   * @returns {NotificationPreference} Preferencias por defecto
   */
  static createDefaults(userId) {
    return new NotificationPreference({
      userId,
      // Los valores por defecto ya están establecidos en el constructor
    });
  }
}

module.exports = { NotificationPreference };
