/**
 * Modelo de dominio para notificaciones
 * 
 * Representa una notificación persistente en el sistema.
 */

class Notification {
  constructor(data) {
    this.id = data.id;
    this.userId = data.userId;
    this.type = data.type;
    this.title = data.title;
    this.message = data.message;
    this.isRead = data.isRead !== undefined ? data.isRead : false;
    this.data = data.data || null;
    this.relatedId = data.relatedId || null;
    this.createdAt = data.createdAt || new Date();
    this.expiresAt = data.expiresAt || null;
  }

  /**
   * Marca la notificación como leída
   * @returns {Notification} Instancia de la notificación
   */
  markAsRead() {
    this.isRead = true;
    return this;
  }

  /**
   * Marca la notificación como no leída
   * @returns {Notification} Instancia de la notificación
   */
  markAsUnread() {
    this.isRead = false;
    return this;
  }

  /**
   * Establece una fecha de expiración para la notificación
   * @param {Date} date - Fecha de expiración
   * @returns {Notification} Instancia de la notificación
   */
  setExpirationDate(date) {
    this.expiresAt = date;
    return this;
  }

  /**
   * Verifica si la notificación ha expirado
   * @returns {boolean} true si ha expirado
   */
  hasExpired() {
    if (!this.expiresAt) {
      return false;
    }
    return this.expiresAt < new Date();
  }

  /**
   * Crea una representación simple para enviar al cliente
   * @returns {Object} Objeto simplificado
   */
  toDTO() {
    return {
      id: this.id,
      type: this.type,
      title: this.title,
      message: this.message,
      isRead: this.isRead,
      data: this.data,
      relatedId: this.relatedId,
      createdAt: this.createdAt,
      expiresAt: this.expiresAt
    };
  }

  /**
   * Crea una notificación desde un evento del sistema
   * @param {string} userId - ID del usuario destinatario
   * @param {string} eventType - Tipo de evento
   * @param {Object} eventPayload - Datos del evento
   * @param {Object} options - Opciones adicionales
   * @returns {Notification} Notificación creada
   */
  static fromEvent(userId, eventType, eventPayload, options = {}) {
    const { title, message } = Notification.formatEventMessage(eventType, eventPayload);
    
    return new Notification({
      id: options.id || null,
      userId,
      type: eventType,
      title,
      message,
      isRead: false,
      data: eventPayload,
      relatedId: Notification.extractRelatedId(eventType, eventPayload),
      createdAt: new Date(),
      expiresAt: options.expiresIn ? new Date(Date.now() + options.expiresIn) : null
    });
  }

  /**
   * Extrae el ID relacionado basado en el tipo de evento
   * @param {string} eventType - Tipo de evento
   * @param {Object} payload - Datos del evento
   * @returns {string|null} ID relacionado
   */
  static extractRelatedId(eventType, payload) {
    if (eventType.startsWith('task.')) {
      return payload.taskId;
    }
    
    if (eventType.startsWith('user.')) {
      return payload.userId;
    }
    
    return null;
  }

  /**
   * Formatea el título y mensaje basado en el tipo de evento
   * @param {string} eventType - Tipo de evento
   * @param {Object} payload - Datos del evento
   * @returns {Object} Objeto con título y mensaje
   */
  static formatEventMessage(eventType, payload) {
    let title = 'Notificación';
    let message = '';

    switch (eventType) {
      case 'task.created':
        title = 'Nueva tarea';
        message = `Se ha creado la tarea: ${payload.title}`;
        break;
      case 'task.updated':
        title = 'Tarea actualizada';
        message = `La tarea "${payload.title || 'Sin título'}" ha sido actualizada`;
        break;
      case 'task.completed':
        title = '¡Tarea completada!';
        message = `Has completado la tarea: ${payload.title}`;
        break;
      case 'task.deleted':
        title = 'Tarea eliminada';
        message = `La tarea "${payload.title}" ha sido eliminada`;
        break;
      case 'task.due_soon':
        title = 'Tareas pendientes';
        message = `Tienes ${payload.taskCount || payload.count || 0} tareas pendientes para los próximos días`;
        break;
      case 'user.registered':
        title = '¡Bienvenido!';
        message = `Tu cuenta ha sido creada exitosamente`;
        break;
      case 'user.login_success':
        title = 'Inicio de sesión';
        message = `Has iniciado sesión correctamente`;
        break;
      default:
        if (payload.title) {
          title = payload.title;
        }
        if (payload.message) {
          message = payload.message;
        } else {
          message = `Notificación del sistema: ${eventType}`;
        }
    }

    return { title, message };
  }
}

module.exports = { Notification };
