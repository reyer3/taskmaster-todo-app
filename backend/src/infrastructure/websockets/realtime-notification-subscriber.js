/**
 * Suscriptor de eventos para enviar notificaciones en tiempo real
 * 
 * Este módulo escucha eventos relevantes del sistema y envía notificaciones
 * en tiempo real a los usuarios a través de WebSockets.
 */
const { eventPublisher, eventTypes } = require('../events');
const { UserEvents, TaskEvents, SystemEvents } = eventTypes;

class RealtimeNotificationSubscriber {
  constructor(options = {}) {
    this.socketServer = options.socketServer;
    this.enabled = options.enabled !== undefined ? options.enabled : true;
    this.unsubscribeFunctions = [];
  }

  /**
   * Inicializa el suscriptor registrándose para eventos
   */
  initialize() {
    if (!this.enabled || !this.socketServer) {
      console.warn('Notificaciones en tiempo real deshabilitadas o sin servidor Socket.IO');
      return;
    }

    console.log('🔔 Inicializando suscriptor de notificaciones en tiempo real...');
    
    // Eventos de tareas
    this.unsubscribeFunctions.push(
      eventPublisher.subscribe(TaskEvents.CREATED, this.handleTaskCreated.bind(this))
    );
    
    this.unsubscribeFunctions.push(
      eventPublisher.subscribe(TaskEvents.UPDATED, this.handleTaskUpdated.bind(this))
    );
    
    this.unsubscribeFunctions.push(
      eventPublisher.subscribe(TaskEvents.COMPLETED, this.handleTaskCompleted.bind(this))
    );
    
    this.unsubscribeFunctions.push(
      eventPublisher.subscribe(TaskEvents.DELETED, this.handleTaskDeleted.bind(this))
    );
    
    this.unsubscribeFunctions.push(
      eventPublisher.subscribe(TaskEvents.DUE_SOON, this.handleTasksDueSoon.bind(this))
    );
    
    // Eventos de usuarios
    this.unsubscribeFunctions.push(
      eventPublisher.subscribe(UserEvents.LOGIN_SUCCESS, this.handleLoginSuccess.bind(this))
    );
    
    // Eventos del sistema
    this.unsubscribeFunctions.push(
      eventPublisher.subscribe(SystemEvents.ERROR, this.handleSystemError.bind(this))
    );
    
    console.log('✅ Suscriptor de notificaciones en tiempo real inicializado');
  }

  /**
   * Desuscribe todos los eventos
   */
  dispose() {
    console.log('🔔 Cerrando suscriptor de notificaciones en tiempo real...');
    this.unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    this.unsubscribeFunctions = [];
    console.log('✅ Suscriptor de notificaciones en tiempo real cerrado');
  }

  /**
   * Maneja el evento de inicio de sesión exitoso
   * @param {Object} event - Evento de inicio de sesión
   */
  async handleLoginSuccess(event) {
    const { userId, email } = event.payload;
    
    this.socketServer.emitToUser(userId, 'auth:login_success', {
      message: `Bienvenido de nuevo, ${email}`,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Maneja el evento de creación de tarea
   * @param {Object} event - Evento de creación
   */
  async handleTaskCreated(event) {
    const { userId, taskId, title, priority, dueDate } = event.payload;
    
    this.socketServer.emitToUser(userId, 'task:created', {
      taskId,
      title,
      priority,
      dueDate,
      message: `Nueva tarea creada: ${title}`,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Maneja el evento de actualización de tarea
   * @param {Object} event - Evento de actualización
   */
  async handleTaskUpdated(event) {
    const { userId, taskId, title, changes } = event.payload;
    const taskTitle = title || 'Tarea';
    
    this.socketServer.emitToUser(userId, 'task:updated', {
      taskId,
      changes,
      message: `Tarea actualizada: ${taskTitle}`,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Maneja el evento de tarea completada
   * @param {Object} event - Evento de tarea completada
   */
  async handleTaskCompleted(event) {
    const { userId, taskId, title } = event.payload;
    
    this.socketServer.emitToUser(userId, 'task:completed', {
      taskId,
      title,
      message: `¡Felicidades! Tarea completada: ${title}`,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Maneja el evento de eliminación de tarea
   * @param {Object} event - Evento de eliminación
   */
  async handleTaskDeleted(event) {
    const { userId, taskId, title } = event.payload;
    
    this.socketServer.emitToUser(userId, 'task:deleted', {
      taskId,
      title,
      message: `Tarea eliminada: ${title}`,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Maneja el evento de tareas próximas a vencer
   * @param {Object} event - Evento de tareas por vencer
   */
  async handleTasksDueSoon(event) {
    const { userId, tasks, daysWindow } = event.payload;
    
    if (tasks.length === 0) return;
    
    // Enviar notificación con las tareas próximas a vencer
    this.socketServer.emitToUser(userId, 'task:due_soon', {
      count: tasks.length,
      tasks: tasks.slice(0, 5), // Limitar a 5 tareas para la notificación
      hasMore: tasks.length > 5,
      daysWindow,
      message: `Tienes ${tasks.length} ${tasks.length === 1 ? 'tarea pendiente' : 'tareas pendientes'} para los próximos ${daysWindow} días`,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Maneja errores del sistema (solo para administradores)
   * @param {Object} event - Evento de error
   */
  async handleSystemError(event) {
    // En un sistema real, habría que identificar a los administradores
    // y solo enviarles a ellos las notificaciones de error
    
    // Por ahora, solo registramos el error
    console.error('Error del sistema (no enviado a WebSocket):', event.payload);
  }
}

module.exports = { RealtimeNotificationSubscriber };
