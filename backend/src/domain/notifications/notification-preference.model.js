/**
 * Modelo de dominio para preferencias de notificaciones
 * 
 * Representa las preferencias de notificaciones de un usuario.
 */

class NotificationPreference {
  constructor(data) {
    if (!data.userId) {
      throw new Error('userId es requerido');
    }
    
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
   * Actualiza las preferencias de notificaciones por email
   * @param {Object} preferences - Preferencias a actualizar
   * @returns {NotificationPreference} Instancia actualizada
   */
  updateEmailPreferences(preferences) {
    // Actualizar preferencias de email
    Object.entries(preferences).forEach(([key, value]) => {
      if (key in this && typeof value === 'boolean') {
        this[key] = value;
      }
    });
    this.updatedAt = new Date();
    return this;
  }

  /**
   * Actualiza las preferencias de notificaciones push
   * @param {Object} preferences - Preferencias a actualizar
   * @returns {NotificationPreference} Instancia actualizada
   */
  updatePushPreferences(preferences) {
    // Actualizar preferencias de push
    Object.entries(preferences).forEach(([key, value]) => {
      if (key in this && typeof value === 'boolean') {
        this[key] = value;
      }
    });
    this.updatedAt = new Date();
    return this;
  }

  /**
   * Actualiza las preferencias de digestos
   * @param {Object} preferences - Preferencias a actualizar
   * @returns {NotificationPreference} Instancia actualizada
   */
  updateDigestPreferences(preferences) {
    // Actualizar preferencias de digestos
    Object.entries(preferences).forEach(([key, value]) => {
      if (key in this && typeof value === 'boolean') {
        this[key] = value;
      }
    });
    this.updatedAt = new Date();
    return this;
  }

  /**
   * Habilita o deshabilita todas las notificaciones
   * @param {boolean} enabled - Estado habilitado/deshabilitado
   * @returns {NotificationPreference} Instancia actualizada
   */
  setAllNotifications(enabled) {
    // Habilitar/deshabilitar todas las notificaciones
    this.emailEnabled = enabled;
    this.pushEnabled = enabled;
    // Establecer todos los canales específicos
    this.emailTaskCreated = enabled;
    this.emailTaskCompleted = enabled;
    this.emailTaskDueSoon = enabled;
    this.pushTaskCreated = enabled;
    this.pushTaskCompleted = enabled;
    this.pushTaskDueSoon = enabled;
    this.pushTaskUpdated = enabled;
    this.pushTaskDeleted = enabled;
    this.updatedAt = new Date();
    return this;
  }

  /**
   * Verifica si un tipo de evento está habilitado para un canal
   * @param {string} eventType - Tipo de evento
   * @param {string} channel - Canal (email, push)
   * @returns {boolean} true si está habilitado
   */
  isEventTypeEnabled(eventType, channel) {
    // Verificar si el canal existe y está habilitado
    if (!this[`${channel}Enabled`]) {
      return false;
    }
    
    // Mapping para eventos específicos a sus claves de preferencia
    const eventMapping = {
      'task.created': {
        email: 'emailTaskCreated',
        push: 'pushTaskCreated'
      },
      'task.completed': {
        email: 'emailTaskCompleted',
        push: 'pushTaskCompleted'
      },
      'task.due_soon': {
        email: 'emailTaskDueSoon',
        push: 'pushTaskDueSoon'
      }
    };
    
    // Si hay un mapeo directo, usámoslo
    if (eventMapping[eventType] && eventMapping[eventType][channel]) {
      return this[eventMapping[eventType][channel]] === true;
    }
    
    // Intento de crear dinámicamente el nombre de la propiedad
    const eventKey = eventType.replace('.', '');
    const preferenceKey = `${channel}${eventKey.charAt(0).toUpperCase() + eventKey.slice(1)}`;
    
    return this[preferenceKey] === true;
  }

  /**
   * Crea una representación simple para enviar al cliente
   * @returns {Object} Objeto simplificado
   */
  toDTO() {
    return {
      userId: this.userId,
      emailEnabled: this.emailEnabled,
      pushEnabled: this.pushEnabled,
      emailTaskCreated: this.emailTaskCreated,
      emailTaskCompleted: this.emailTaskCompleted,
      emailTaskDueSoon: this.emailTaskDueSoon,
      pushTaskCreated: this.pushTaskCreated,
      pushTaskCompleted: this.pushTaskCompleted,
      pushTaskDueSoon: this.pushTaskDueSoon,
      pushTaskUpdated: this.pushTaskUpdated,
      pushTaskDeleted: this.pushTaskDeleted,
      dailyDigest: this.dailyDigest,
      weeklyDigest: this.weeklyDigest
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
