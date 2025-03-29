/**
 * Suscriptor de eventos para generar notificaciones
 * 
 * Este módulo escucha eventos relevantes del sistema y genera
 * notificaciones persistentes y en tiempo real.
 */
const { eventPublisher, eventTypes } = require('../index');
const { UserEvents, TaskEvents, SystemEvents } = eventTypes;
const { NotificationService } = require('../../../services/notification.service');
const { NotificationRepository } = require('../../repositories/notification.repository');
const { NotificationPreferenceRepository } = require('../../repositories/notification-preference.repository');

class NotificationSubscriber {
  constructor(options = {}) {
    this.notificationService = options.notificationService || new NotificationService(
      new NotificationRepository(),
      new NotificationPreferenceRepository(),
      {
        socketServer: options.socketServer,
        eventPublisher: options.eventPublisher || eventPublisher
      }
    );
    this.enabled = options.enabled !== undefined ? options.enabled : true;
    this.unsubscribeFunctions = [];
  }

  /**
   * Inicializa el suscriptor registrándose para eventos
   */
  initialize() {
    if (!this.enabled) return;

    console.log('🔔 Inicializando suscriptor de notificaciones...');
    
    // Suscribirse a eventos de usuario
    this.unsubscribeFunctions.push(
      eventPublisher.subscribe(UserEvents.REGISTERED, this.handleUserRegistered.bind(this))
    );
    
    this.unsubscribeFunctions.push(
      eventPublisher.subscribe(UserEvents.LOGIN_SUCCESS, this.handleLoginSuccess.bind(this))
    );
    
    // Suscribirse a eventos de tareas
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
    
    // Suscribirse a eventos del sistema
    this.unsubscribeFunctions.push(
      eventPublisher.subscribe(SystemEvents.ERROR, this.handleSystemError.bind(this))
    );
    
    console.log('✅ Suscriptor de notificaciones inicializado');
  }

  /**
   * Desuscribe todos los eventos
   */
  dispose() {
    console.log('🔔 Cerrando suscriptor de notificaciones...');
    this.unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    this.unsubscribeFunctions = [];
    console.log('✅ Suscriptor de notificaciones cerrado');
  }

  /**
   * Maneja el evento de registro de usuario
   * @param {Object} event - Evento de registro
   */
  async handleUserRegistered(event) {
    try {
      const { userId, email } = event.payload;
      
      // Crear preferencias por defecto para el usuario
      await this.notificationService.getUserPreferences(userId);
      
      // Crear notificación de bienvenida
      await this.notificationService.createNotification(
        userId,
        UserEvents.REGISTERED,
        {
          title: '¡Bienvenido a TaskMaster!',
          message: 'Tu cuenta ha sido creada exitosamente. Comienza a organizar tus tareas.',
          email
        },
        {
          forceStore: true, // Forzar almacenamiento independientemente de preferencias
          expiresIn: 30 * 24 * 60 * 60 * 1000 // 30 días
        }
      );
    } catch (error) {
      console.error('Error en handleUserRegistered:', error);
    }
  }

  /**
   * Maneja el evento de inicio de sesión exitoso
   * @param {Object} event - Evento de inicio de sesión
   */
  async handleLoginSuccess(event) {
    try {
      const { userId, email } = event.payload;
      
      // No crear notificación persistente, solo notificación en tiempo real
      // La notificación en tiempo real la maneja el servicio de notificaciones
      // según las preferencias del usuario
      await this.notificationService.createNotification(
        userId,
        UserEvents.LOGIN_SUCCESS,
        {
          message: `Bienvenido de nuevo, ${email}`,
          timestamp: new Date().toISOString()
        },
        {
          forceStore: false // No forzar almacenamiento
        }
      );
    } catch (error) {
      console.error('Error en handleLoginSuccess:', error);
    }
  }

  /**
   * Maneja el evento de creación de tarea
   * @param {Object} event - Evento de creación
   */
  async handleTaskCreated(event) {
    try {
      const { userId, taskId, title, priority, dueDate } = event.payload;
      
      await this.notificationService.createNotification(
        userId,
        TaskEvents.CREATED,
        {
          taskId,
          title,
          priority,
          dueDate,
          message: `Nueva tarea creada: ${title}`
        }
      );
    } catch (error) {
      console.error('Error en handleTaskCreated:', error);
    }
  }

  /**
   * Maneja el evento de actualización de tarea
   * @param {Object} event - Evento de actualización
   */
  async handleTaskUpdated(event) {
    try {
      const { userId, taskId, changes, currentState } = event.payload;
      const title = currentState?.title || 'Tarea';
      
      // Solo crear notificación para cambios significativos
      const significantChanges = ['dueDate', 'priority'];
      const hasSignificantChanges = significantChanges.some(field => changes.includes(field));
      
      if (hasSignificantChanges) {
        await this.notificationService.createNotification(
          userId,
          TaskEvents.UPDATED,
          {
            taskId,
            title,
            changes,
            currentState,
            message: `Tarea actualizada: ${title}`
          }
        );
      }
    } catch (error) {
      console.error('Error en handleTaskUpdated:', error);
    }
  }

  /**
   * Maneja el evento de tarea completada
   * @param {Object} event - Evento de tarea completada
   */
  async handleTaskCompleted(event) {
    try {
      const { userId, taskId, title } = event.payload;
      
      await this.notificationService.createNotification(
        userId,
        TaskEvents.COMPLETED,
        {
          taskId,
          title,
          message: `¡Felicidades! Tarea completada: ${title}`,
          completedAt: new Date().toISOString()
        }
      );
    } catch (error) {
      console.error('Error en handleTaskCompleted:', error);
    }
  }

  /**
   * Maneja el evento de eliminación de tarea
   * @param {Object} event - Evento de eliminación
   */
  async handleTaskDeleted(event) {
    try {
      const { userId, taskId, title } = event.payload;
      
      // Para tareas eliminadas, podemos optar por no almacenar la notificación
      // persistente, solo enviar en tiempo real
      await this.notificationService.createNotification(
        userId,
        TaskEvents.DELETED,
        {
          taskId,
          title,
          message: `Tarea eliminada: ${title}`,
          deletedAt: new Date().toISOString()
        },
        {
          forceStore: false // No forzar almacenamiento
        }
      );
    } catch (error) {
      console.error('Error en handleTaskDeleted:', error);
    }
  }

  /**
   * Maneja el evento de tareas próximas a vencer
   * @param {Object} event - Evento de tareas por vencer
   */
  async handleTasksDueSoon(event) {
    try {
      const { userId, tasks, taskCount, daysWindow } = event.payload;
      const count = taskCount || tasks?.length || 0;
      
      if (count === 0) return;
      
      await this.notificationService.createNotification(
        userId,
        TaskEvents.DUE_SOON,
        {
          count,
          tasks: tasks?.slice(0, 5), // Limitar a 5 tareas para la notificación
          hasMore: tasks?.length > 5,
          daysWindow,
          message: `Tienes ${count} ${count === 1 ? 'tarea pendiente' : 'tareas pendientes'} para los próximos ${daysWindow} días`
        },
        {
          expiresIn: 24 * 60 * 60 * 1000 // 24 horas
        }
      );
    } catch (error) {
      console.error('Error en handleTasksDueSoon:', error);
    }
  }

  /**
   * Maneja errores del sistema
   * @param {Object} event - Evento de error
   */
  async handleSystemError(event) {
    try {
      const { type, message, path } = event.payload;
      
      // Aquí podríamos crear notificaciones para administradores del sistema
      // pero por ahora solo lo registramos
      console.error(`Error del sistema (${type}): ${message}, Path: ${path}`);
    } catch (error) {
      console.error('Error en handleSystemError:', error);
    }
  }
}

module.exports = { NotificationSubscriber };
