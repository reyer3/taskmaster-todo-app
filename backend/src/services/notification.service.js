/**
 * Servicio para la gestión de notificaciones
 * 
 * Este servicio se encarga de la creación, consulta y gestión de
 * notificaciones persistentes y preferencias de notificación.
 */
const { v4: uuidv4 } = require('uuid');
const { Notification } = require('../domain/notifications/notification.model');
const { NotificationPreference } = require('../domain/notifications/notification-preference.model');
const { AppError, NotFoundError } = require('../utils/errors/app-error');

class NotificationService {
  constructor(notificationRepository, notificationPreferenceRepository, config = {}) {
    this.notificationRepository = notificationRepository;
    this.notificationPreferenceRepository = notificationPreferenceRepository;
    this.socketServer = config.socketServer;
    this.eventPublisher = config.eventPublisher;
  }

  /**
   * Obtiene las notificaciones de un usuario
   * @param {string} userId - ID del usuario
   * @param {Object} options - Opciones de filtrado
   * @returns {Promise<Object>} Objeto con notificaciones y metadata
   */
  async getUserNotifications(userId, options = {}) {
    // Obtener las notificaciones
    const result = await this.notificationRepository.findByUserId(userId, options);
    
    // Para compatibilidad con las pruebas, verificar si result es un array o un objeto con items
    if (Array.isArray(result)) {
      return result;
    } else if (result && Array.isArray(result.items)) {
      return result.items;
    } else {
      return [];
    }
  }

  /**
   * Crea una nueva notificación
   * @param {string} userId - ID del usuario destinatario
   * @param {string} type - Tipo de notificación
   * @param {Object} data - Datos de la notificación
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Notification>} Notificación creada
   */
  async createNotification(data) {
    if (!data || !data.userId || !data.type) {
      throw new Error('Se requieren userId y type para crear una notificación');
    }

    const { userId, type, title, message, ...rest } = data;
    
    // Verificar preferencias del usuario si es un tipo conocido
    const shouldStore = await this.shouldStoreNotification(userId, type);
    
    if (!shouldStore && !data.forceStore) {
      // Si no se debe almacenar, solo enviar en tiempo real si corresponde
      if (this.socketServer && (await this.shouldSendRealtime(type, await this.getUserPreferences(userId)))) {
        this.sendRealtimeNotification(userId, type, data);
      }
      return null;
    }
    
    // Crear un objeto para la notificación
    const notificationData = {
      id: data.id || uuidv4(),
      userId,
      type,
      title,
      message,
      isRead: false,
      ...rest
    };

    // Crear y guardar la notificación
    const notification = new Notification(notificationData);
    const savedNotification = await this.notificationRepository.create(notification);
    
    // Enviar en tiempo real si corresponde
    if (this.socketServer && (await this.shouldSendRealtime(type, await this.getUserPreferences(userId)))) {
      this.sendRealtimeNotification(userId, type, {
        ...data,
        notificationId: savedNotification.id
      });
    }
    
    return savedNotification;
  }

  /**
   * Marca una notificación como leída
   * @param {string} notificationId - ID de la notificación
   * @param {string} userId - ID del usuario propietario
   * @returns {Promise<Notification>} Notificación actualizada
   */
  async markAsRead(notificationId, userId) {
    const notification = await this.notificationRepository.findById(notificationId);
    
    if (!notification) {
      throw new NotFoundError('Notificación no encontrada');
    }
    
    if (notification.userId !== userId) {
      throw new AppError('No autorizado: No puedes marcar como leída una notificación que no te pertenece', 403);
    }
    
    // Marcar como leída
    notification.markAsRead();
    return this.notificationRepository.update(notification);
  }

  /**
   * Marca todas las notificaciones de un usuario como leídas
   * @param {string} userId - ID del usuario
   * @param {Object} options - Opciones adicionales (filtros)
   * @returns {Promise<number>} Número de notificaciones marcadas
   */
  async markAllAsRead(userId, options = {}) {
    return this.notificationRepository.markAllAsRead(userId, options);
  }

  /**
   * Elimina una notificación
   * @param {string} notificationId - ID de la notificación
   * @param {string} userId - ID del usuario propietario
   * @returns {Promise<boolean>} true si se eliminó con éxito
   */
  async deleteNotification(notificationId, userId) {
    const notification = await this.notificationRepository.findById(notificationId);
    
    if (!notification) {
      throw new NotFoundError('Notificación no encontrada');
    }
    
    if (notification.userId !== userId) {
      throw new AppError('No autorizado: No puedes eliminar una notificación que no te pertenece', 403);
    }
    
    return this.notificationRepository.delete(notificationId);
  }

  /**
   * Elimina todas las notificaciones de un usuario
   * @param {string} userId - ID del usuario
   * @param {Object} options - Opciones de eliminación
   * @returns {Promise<number>} Número de notificaciones eliminadas
   */
  async deleteAllNotifications(userId, options = {}) {
    return this.notificationRepository.deleteAllForUser(userId, options);
  }

  /**
   * Elimina notificaciones antiguas y expiradas
   * @param {Object|number} options - Opciones de limpieza u olderThan
   * @param {boolean} onlyRead - Si solo se deben eliminar las leídas
   * @returns {Promise<number>} Número de notificaciones eliminadas
   */
  async cleanupNotifications(options = {}, onlyRead = true) {
    if (typeof options === 'number') {
      return this.notificationRepository.deleteExpired(options, onlyRead);
    } else if (typeof options === 'object') {
      const { olderThan = 7, onlyRead = true } = options;
      return this.notificationRepository.deleteExpired(olderThan, onlyRead);
    } else {
      return this.notificationRepository.deleteExpired(7, true);
    }
  }

  /**
   * Obtiene las preferencias de notificaciones de un usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} Preferencias del usuario
   */
  async getUserPreferences(userId) {
    let preferences = await this.notificationPreferenceRepository.findByUserId(userId);
    
    // Si no existe, crear preferencias por defecto
    if (!preferences) {
      preferences = NotificationPreference.createDefaults(userId);
      
      // Intentar guardar (si el repositorio lo soporta)
      if (this.notificationPreferenceRepository.create) {
        preferences = await this.notificationPreferenceRepository.create(preferences);
      } else if (this.notificationPreferenceRepository.createDefaults) {
        preferences = await this.notificationPreferenceRepository.createDefaults(userId);
      }
    }
    
    // Devolver las preferencias como DTO si es posible
    return preferences && preferences.toDTO ? preferences.toDTO() : preferences;
  }

  /**
   * Actualiza las preferencias de notificaciones de un usuario
   * @param {string} userId - ID del usuario
   * @param {Object} updates - Actualizaciones a las preferencias
   * @returns {Promise<Object>} Preferencias actualizadas
   */
  async updateUserPreferences(userId, updates) {
    let preferences = await this.notificationPreferenceRepository.findByUserId(userId);
    
    // Si no existe, crear preferencias por defecto
    if (!preferences) {
      preferences = NotificationPreference.createDefaults(userId);
      
      // Aplicar actualizaciones a las preferencias por defecto
      if (preferences.update) {
        preferences.update(updates);
      } else {
        // Filtrar propiedades inválidas
        const filteredUpdates = {};
        for (const [key, value] of Object.entries(updates)) {
          if (typeof value === 'boolean' && key in preferences) {
            filteredUpdates[key] = value;
          }
        }
        
        Object.assign(preferences, filteredUpdates);
      }
      
      // Crear nuevas preferencias
      if (this.notificationPreferenceRepository.create) {
        preferences = await this.notificationPreferenceRepository.create(preferences);
      }
    } else {
      // Aplicar actualizaciones si el método existe
      if (preferences.update) {
        preferences.update(updates);
      } else {
        // Filtrar propiedades inválidas
        const filteredUpdates = {};
        for (const [key, value] of Object.entries(updates)) {
          if (typeof value === 'boolean' && key in preferences) {
            filteredUpdates[key] = value;
          }
        }
        
        Object.assign(preferences, filteredUpdates);
      }
      
      // Guardar cambios - usar update o saveOrUpdate según esté disponible
      if (this.notificationPreferenceRepository.update) {
        preferences = await this.notificationPreferenceRepository.update(preferences);
      }
    }
    
    // Devolver como DTO si es posible
    return preferences && preferences.toDTO ? preferences.toDTO() : preferences;
  }

  /**
   * Verifica si se debe almacenar una notificación según las preferencias
   * @param {string} userId - ID del usuario
   * @param {string} eventType - Tipo de evento
   * @returns {Promise<boolean>} true si se debe almacenar
   */
  async shouldStoreNotification(userId, eventType) {
    // Por defecto, almacenar todas las notificaciones
    let preferences = await this.notificationPreferenceRepository.findByUserId(userId);
    
    // Si no hay preferencias, usar valores por defecto
    if (!preferences) {
      return true;
    }

    // Verificar si es un tipo que siempre se almacena
    const alwaysStoredTypes = [
      'user.registered',
      'system.announcement'
    ];

    if (alwaysStoredTypes.includes(eventType)) {
      return true;
    }

    // Para otros tipos, verificar preferencias
    if (eventType && typeof eventType === 'string' && eventType.startsWith('task.')) {
      // Para tareas, almacenar si cualquiera de las notificaciones está habilitada
      return preferences.emailEnabled || preferences.pushEnabled;
    }

    return true;
  }

  /**
   * Verifica si se debe enviar una notificación en tiempo real
   * @param {string} eventType - Tipo de evento
   * @param {Object} preferences - Preferencias del usuario
   * @returns {boolean} true si se debe enviar
   */
  shouldSendRealtime(eventType, preferences) {
    // Si no hay servidor websocket, no enviar
    if (!this.socketServer) {
      return false;
    }
    
    // Si no hay preferencias, usar valores por defecto
    if (!preferences) {
      return true;
    }
    
    // Si las preferencias tienen el método isPushEnabledForEvent, usarlo
    if (preferences.isPushEnabledForEvent) {
      return preferences.isPushEnabledForEvent(eventType);
    }
    
    // Si no tiene el método, verificar manualmente
    if (!preferences.pushEnabled) {
      return false;
    }
    
    // Verificar por tipo específico
    switch (eventType) {
      case 'task.created':
        return preferences.pushTaskCreated !== false;
      case 'task.updated':
        return preferences.pushTaskUpdated !== false;
      case 'task.completed':
        return preferences.pushTaskCompleted !== false;
      case 'task.deleted':
        return preferences.pushTaskDeleted !== false;
      case 'task.due_soon':
        return preferences.pushTaskDueSoon !== false;
      default:
        return true; // Por defecto, otros tipos están habilitados si el push general lo está
    }
  }

  /**
   * Envía una notificación en tiempo real a través de WebSockets
   * @param {string} userId - ID del usuario destinatario
   * @param {string} eventType - Tipo de evento
   * @param {Object} data - Datos del evento
   * @returns {boolean} true si se envió correctamente
   */
  sendRealtimeNotification(userId, eventType, data) {
    if (!this.socketServer) {
      return false;
    }
    
    // Convertir el tipo de evento al formato de WebSocket
    const wsEventType = this.convertEventTypeToWSFormat(eventType);
    
    // Enviar la notificación
    return this.socketServer.emitToUser(userId, wsEventType, {
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Convierte un tipo de evento al formato usado en WebSockets
   * @param {string} eventType - Tipo de evento (ej: task.created)
   * @returns {string} Tipo de evento para WebSocket (ej: task:created)
   */
  convertEventTypeToWSFormat(eventType) {
    return eventType.replace('.', ':');
  }
}

module.exports = { NotificationService };
