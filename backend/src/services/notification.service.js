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
    const notifications = await this.notificationRepository.findByUserId(userId, options);
    const unreadCount = await this.notificationRepository.countUnread(userId);

    return {
      items: notifications.map(notification => notification.toDTO()),
      unreadCount,
      total: notifications.length,
      hasMore: notifications.length === options.limit
    };
  }

  /**
   * Crea una nueva notificación
   * @param {string} userId - ID del usuario destinatario
   * @param {string} type - Tipo de notificación
   * @param {Object} data - Datos de la notificación
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Notification>} Notificación creada
   */
  async createNotification(userId, type, data, options = {}) {
    // Verificar preferencias del usuario si es un tipo conocido
    const shouldStore = await this.shouldStoreNotification(userId, type);
    
    if (!shouldStore && !options.forceStore) {
      // Si no se debe almacenar, solo enviar en tiempo real si corresponde
      if (this.socketServer && (await this.shouldSendRealtime(userId, type))) {
        this.sendRealtimeNotification(userId, type, data);
      }
      return null;
    }
    
    // Crear la notificación
    const notification = Notification.fromEvent(
      userId, 
      type, 
      data, 
      { id: uuidv4(), ...options }
    );
    
    // Guardar en la base de datos
    const savedNotification = await this.notificationRepository.create(notification);
    
    // Enviar en tiempo real si corresponde
    if (this.socketServer && (await this.shouldSendRealtime(userId, type))) {
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
      throw new AppError('No autorizado para acceder a esta notificación', 403);
    }
    
    // Marcar como leída
    notification.markAsRead();
    return this.notificationRepository.update(notification);
  }

  /**
   * Marca todas las notificaciones de un usuario como leídas
   * @param {string} userId - ID del usuario
   * @param {string[]} [ids] - IDs específicos (opcional)
   * @returns {Promise<number>} Número de notificaciones marcadas
   */
  async markAllAsRead(userId, ids = []) {
    return this.notificationRepository.markAsRead(userId, ids);
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
      throw new AppError('No autorizado para eliminar esta notificación', 403);
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
   * @param {Object} options - Opciones de limpieza
   * @returns {Promise<number>} Número de notificaciones eliminadas
   */
  async cleanupNotifications(options = {}) {
    return this.notificationRepository.deleteExpired(options);
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
      preferences = await this.notificationPreferenceRepository.createDefaults(userId);
    }
    
    return preferences.toDTO();
  }

  /**
   * Actualiza las preferencias de notificaciones de un usuario
   * @param {string} userId - ID del usuario
   * @param {Object} updates - Actualizaciones a las preferencias
   * @returns {Promise<Object>} Preferencias actualizadas
   */
  async updatePreferences(userId, updates) {
    let preferences = await this.notificationPreferenceRepository.findByUserId(userId);
    
    // Si no existe, crear preferencias por defecto
    if (!preferences) {
      preferences = NotificationPreference.createDefaults(userId);
    }
    
    // Aplicar actualizaciones
    preferences.update(updates);
    
    // Guardar cambios
    const updated = await this.notificationPreferenceRepository.saveOrUpdate(preferences);
    
    return updated.toDTO();
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
    if (eventType.startsWith('task.')) {
      // Para tareas, almacenar si cualquiera de las notificaciones está habilitada
      return preferences.emailEnabled || preferences.pushEnabled;
    }

    return true;
  }

  /**
   * Verifica si se debe enviar una notificación en tiempo real
   * @param {string} userId - ID del usuario
   * @param {string} eventType - Tipo de evento
   * @returns {Promise<boolean>} true si se debe enviar
   */
  async shouldSendRealtime(userId, eventType) {
    // Si no hay servidor websocket, no enviar
    if (!this.socketServer) {
      return false;
    }
    
    // Obtener preferencias
    let preferences = await this.notificationPreferenceRepository.findByUserId(userId);
    
    // Si no hay preferencias, usar valores por defecto
    if (!preferences) {
      return true;
    }
    
    // Verificar preferencias específicas para este tipo
    return preferences.isPushEnabledForEvent(eventType);
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
