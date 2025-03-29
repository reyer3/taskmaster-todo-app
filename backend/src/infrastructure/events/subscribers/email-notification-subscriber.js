/**
 * Suscriptor de eventos para enviar notificaciones por correo electrónico
 * 
 * Este módulo escucha eventos relevantes y envía notificaciones
 * por correo electrónico según las preferencias del usuario.
 */
const { eventPublisher, eventTypes } = require('../index');
const { UserEvents, TaskEvents, SystemEvents, AuthEvents } = eventTypes;
const emailService = require('../../../services/email.service');
const { UserRepository } = require('../../repositories/user.repository');
const { NotificationPreferenceRepository } = require('../../repositories/notification-preference.repository');

class EmailNotificationSubscriber {
  constructor(options = {}) {
    this.userRepository = options.userRepository || new UserRepository();
    this.preferenceRepository = options.preferenceRepository || new NotificationPreferenceRepository();
    this.emailService = options.emailService || emailService;
    this.enabled = options.enabled !== undefined ? options.enabled : true;
    this.unsubscribeFunctions = [];
    
    // Mapa para evitar enviar muchos correos a un mismo usuario en poco tiempo
    this.recentEmailsSent = new Map();
    
    // Caché de búsqueda de usuario para evitar múltiples consultas a la BD
    this.userCache = new Map();
    
    // Cola de notificaciones pendientes por usuario para digestos
    this.pendingNotifications = new Map();
  }

  /**
   * Inicializa el suscriptor registrándose para eventos
   */
  initialize() {
    if (!this.enabled) return;

    console.log('📧 Inicializando suscriptor de notificaciones por email...');
    
    // Suscribirse a eventos de usuario
    this.unsubscribeFunctions.push(
      eventPublisher.subscribe(UserEvents.REGISTERED, this.handleUserRegistered.bind(this))
    );
    
    // Suscribirse a eventos de tareas
    this.unsubscribeFunctions.push(
      eventPublisher.subscribe(TaskEvents.CREATED, this.handleTaskCreated.bind(this))
    );
    
    this.unsubscribeFunctions.push(
      eventPublisher.subscribe(TaskEvents.COMPLETED, this.handleTaskCompleted.bind(this))
    );
    
    this.unsubscribeFunctions.push(
      eventPublisher.subscribe(TaskEvents.DUE_SOON, this.handleTasksDueSoon.bind(this))
    );
    
    // Suscribirse a eventos de autenticación
    this.unsubscribeFunctions.push(
      eventPublisher.subscribe(AuthEvents.PASSWORD_RESET_REQUESTED, this.handlePasswordResetRequested.bind(this))
    );
    
    this.unsubscribeFunctions.push(
      eventPublisher.subscribe(AuthEvents.PASSWORD_CHANGED, this.handlePasswordChanged.bind(this))
    );
    
    this.unsubscribeFunctions.push(
      eventPublisher.subscribe(AuthEvents.NEW_LOGIN, this.handleNewLogin.bind(this))
    );
    
    this.unsubscribeFunctions.push(
      eventPublisher.subscribe(AuthEvents.SUSPICIOUS_LOGIN_ATTEMPT, this.handleSuspiciousLoginAttempt.bind(this))
    );
    
    // Configurar limpieza periódica de caché
    this.cleanupInterval = setInterval(() => {
      this.cleanupCaches();
    }, 60 * 60 * 1000); // Cada hora
    
    // Configurar envío de digestos (resúmenes)
    this.digestInterval = setInterval(() => {
      this.sendPendingDigests();
    }, 15 * 60 * 1000); // Cada 15 minutos
    
    console.log('✅ Suscriptor de notificaciones por email inicializado');
  }

  /**
   * Desuscribe todos los eventos y limpia los intervalos
   */
  dispose() {
    console.log('📧 Cerrando suscriptor de notificaciones por email...');
    this.unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    this.unsubscribeFunctions = [];
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    if (this.digestInterval) {
      clearInterval(this.digestInterval);
    }
    
    console.log('✅ Suscriptor de notificaciones por email cerrado');
  }

  /**
   * Limpia los cachés para evitar fugas de memoria
   */
  cleanupCaches() {
    const now = Date.now();
    
    // Limpiar caché de emails recientes (más de 1 hora)
    for (const [key, timestamp] of this.recentEmailsSent.entries()) {
      if (now - timestamp > 60 * 60 * 1000) { // 1 hora
        this.recentEmailsSent.delete(key);
      }
    }
    
    // Limpiar caché de usuarios (más de 30 minutos)
    for (const [userId, data] of this.userCache.entries()) {
      if (now - data.timestamp > 30 * 60 * 1000) { // 30 minutos
        this.userCache.delete(userId);
      }
    }
  }

  /**
   * Envía los digestos pendientes a los usuarios
   */
  async sendPendingDigests() {
    try {
      for (const [userId, notifications] of this.pendingNotifications.entries()) {
        if (notifications.length === 0) continue;
        
        // Obtener usuario
        const user = await this.getUserById(userId);
        if (!user) continue;
        
        // Verificar preferencias (por si han cambiado)
        const preferences = await this.getPreferences(userId);
        if (!preferences || !preferences.emailEnabled) continue;
        
        // Enviar digesto
        await this.emailService.sendNotificationDigestEmail(user, notifications);
        
        // Limpiar notificaciones enviadas
        this.pendingNotifications.set(userId, []);
        
        // Registrar el envío reciente
        this.recentEmailsSent.set(userId, Date.now());
        
        console.log(`📧 Enviado digesto de ${notifications.length} notificaciones a ${user.email}`);
      }
    } catch (error) {
      console.error('Error al enviar digestos de notificaciones:', error);
    }
  }

  /**
   * Obtiene un usuario por ID con caché
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object|null>} Usuario o null si no existe
   */
  async getUserById(userId) {
    // Verificar caché
    const cachedUser = this.userCache.get(userId);
    if (cachedUser && (Date.now() - cachedUser.timestamp < 30 * 60 * 1000)) {
      return cachedUser.data;
    }
    
    try {
      const user = await this.userRepository.findById(userId);
      if (user) {
        // Guardar en caché
        this.userCache.set(userId, {
          data: user,
          timestamp: Date.now()
        });
      }
      return user;
    } catch (error) {
      console.error(`Error al obtener usuario ${userId}:`, error);
      return null;
    }
  }

  /**
   * Obtiene las preferencias de notificación de un usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object|null>} Preferencias o null si no existen
   */
  async getPreferences(userId) {
    try {
      const preferences = await this.preferenceRepository.findByUserId(userId);
      return preferences;
    } catch (error) {
      console.error(`Error al obtener preferencias de ${userId}:`, error);
      return null;
    }
  }

  /**
   * Verifica si un email se ha enviado recientemente al usuario
   * @param {string} userId - ID del usuario
   * @param {string} type - Tipo de notificación
   * @returns {boolean} true si se ha enviado recientemente
   */
  hasRecentlySentEmail(userId, type) {
    const key = `${userId}-${type}`;
    const timestamp = this.recentEmailsSent.get(key);
    
    if (!timestamp) return false;
    
    // Verificar si han pasado menos de 30 minutos
    return (Date.now() - timestamp) < 30 * 60 * 1000;
  }

  /**
   * Registra un email enviado recientemente
   * @param {string} userId - ID del usuario
   * @param {string} type - Tipo de notificación
   */
  markEmailAsSent(userId, type) {
    const key = `${userId}-${type}`;
    this.recentEmailsSent.set(key, Date.now());
  }

  /**
   * Añade una notificación a la cola de digestos
   * @param {string} userId - ID del usuario
   * @param {Object} notification - Notificación a añadir
   */
  addToDigestQueue(userId, notification) {
    if (!this.pendingNotifications.has(userId)) {
      this.pendingNotifications.set(userId, []);
    }
    
    this.pendingNotifications.get(userId).push(notification);
  }

  /**
   * Procesa una notificación y decide si enviarla inmediatamente o añadirla al digesto
   * @param {string} userId - ID del usuario
   * @param {string} type - Tipo de evento
   * @param {Object} data - Datos del evento
   * @param {boolean} immediate - Si debe enviarse inmediatamente
   */
  async processNotification(userId, type, data, immediate = false) {
    try {
      // Obtener el usuario
      const user = await this.getUserById(userId);
      if (!user) return;
      
      // Obtener preferencias de notificación
      const preferences = await this.getPreferences(userId);
      if (!preferences || !preferences.emailEnabled) return;
      
      // Verificar si la preferencia específica está habilitada
      const preferenceName = `${type.toLowerCase().replace('.', '_')}Notifications`;
      if (preferences[preferenceName] === false) return;
      
      // Verificar si se ha enviado recientemente un email de este tipo
      if (this.hasRecentlySentEmail(userId, type) && !immediate) {
        // En lugar de enviar inmediatamente, añadir a la cola de digestos
        this.addToDigestQueue(userId, { type, data, timestamp: Date.now() });
        return;
      }
      
      // Determinar qué tipo de email enviar basado en el tipo de evento
      let emailSent = false;
      switch (type) {
        case UserEvents.REGISTERED:
          await this.emailService.sendWelcomeEmail(user);
          emailSent = true;
          break;
          
        case TaskEvents.CREATED:
          if (preferences.taskNotifications) {
            await this.emailService.sendImmediateNotificationEmail(user, {
              type: TaskEvents.CREATED,
              title: 'Nueva tarea creada',
              message: `Has creado una nueva tarea: ${data.task.title}`,
              data: data.task
            });
            emailSent = true;
          }
          break;
          
        case TaskEvents.COMPLETED:
          if (preferences.taskNotifications) {
            await this.emailService.sendImmediateNotificationEmail(user, {
              type: TaskEvents.COMPLETED,
              title: '¡Tarea completada!',
              message: `Has completado la tarea: ${data.task.title}`,
              data: data.task
            });
            emailSent = true;
          }
          break;
          
        case TaskEvents.DUE_SOON:
          if (preferences.reminderNotifications) {
            await this.emailService.sendTaskReminderEmail(user, data.tasks[0]);
            emailSent = true;
          }
          break;
          
        // Eventos de autenticación
        case AuthEvents.PASSWORD_RESET_REQUESTED:
          await this.emailService.sendPasswordResetEmail(user, data.resetToken);
          emailSent = true;
          break;
          
        case AuthEvents.PASSWORD_CHANGED:
          // Este método es nuevo y necesita ser agregado al email.service.js
          // Por ahora, usamos el sendImmediateNotificationEmail como fallback
          await this.emailService.sendImmediateNotificationEmail(user, {
            type: AuthEvents.PASSWORD_CHANGED,
            title: 'Tu contraseña ha sido cambiada',
            message: 'Tu contraseña ha sido cambiada exitosamente. Si no realizaste este cambio, contacta a soporte inmediatamente.',
            data: {
              changedAt: data.changedAt || new Date()
            }
          });
          emailSent = true;
          break;
          
        case AuthEvents.NEW_LOGIN:
          // Este método es nuevo y necesita ser agregado al email.service.js
          // Por ahora, usamos el sendImmediateNotificationEmail como fallback
          await this.emailService.sendImmediateNotificationEmail(user, {
            type: AuthEvents.NEW_LOGIN,
            title: 'Nuevo inicio de sesión en tu cuenta',
            message: `Se ha detectado un nuevo inicio de sesión en tu cuenta desde ${data.location || 'una ubicación desconocida'}.`,
            data: {
              device: data.device,
              location: data.location,
              ip: data.ip,
              time: data.time || new Date()
            }
          });
          emailSent = true;
          break;
          
        case AuthEvents.SUSPICIOUS_LOGIN_ATTEMPT:
          // Este método es nuevo y necesita ser agregado al email.service.js
          // Por ahora, usamos el sendImmediateNotificationEmail como fallback
          await this.emailService.sendImmediateNotificationEmail(user, {
            type: AuthEvents.SUSPICIOUS_LOGIN_ATTEMPT,
            title: '⚠️ Alerta de seguridad: Actividad sospechosa',
            message: 'Hemos detectado un intento de inicio de sesión sospechoso en tu cuenta. Si no fuiste tú, cambia tu contraseña inmediatamente.',
            data: data.attempt
          });
          emailSent = true;
          break;
          
        default:
          // Tipos de notificación no manejados específicamente
          this.addToDigestQueue(userId, { type, data, timestamp: Date.now() });
          return;
      }
      
      // Si se envió un email, marcarlo como enviado
      if (emailSent) {
        this.markEmailAsSent(userId, type);
        console.log(`📧 Email tipo "${type}" enviado a ${user.email}`);
      }
    } catch (error) {
      console.error(`Error al procesar notificación tipo "${type}" para usuario ${userId}:`, error);
    }
  }

  /**
   * Manejador para el evento de registro de usuario
   * @param {Object} event - Evento de registro
   */
  async handleUserRegistered(event) {
    const { userId, user } = event.payload || event.data || {};
    if (!userId) {
      console.error('handleUserRegistered: No se encontró userId en el evento');
      return;
    }
    await this.processNotification(userId, UserEvents.REGISTERED, { user }, true);
  }

  /**
   * Manejador para el evento de creación de tarea
   * @param {Object} event - Evento de creación de tarea
   */
  async handleTaskCreated(event) {
    const { userId, taskId, title, description, dueDate } = event.payload || event.data || {};
    if (!userId || !taskId) {
      console.error('handleTaskCreated: Datos incompletos en el evento');
      return;
    }
    
    await this.processNotification(userId, TaskEvents.CREATED, { 
      task: { id: taskId, title, description, dueDate }
    });
  }

  /**
   * Manejador para el evento de tarea completada
   * @param {Object} event - Evento de tarea completada
   */
  async handleTaskCompleted(event) {
    const { userId, taskId, title } = event.payload || event.data || {};
    if (!userId || !taskId) {
      console.error('handleTaskCompleted: Datos incompletos en el evento');
      return;
    }
    
    await this.processNotification(userId, TaskEvents.COMPLETED, { 
      task: { id: taskId, title, completedAt: new Date() }
    });
  }

  /**
   * Manejador para el evento de tareas próximas a vencer
   * @param {Object} event - Evento de tareas próximas a vencer
   */
  async handleTasksDueSoon(event) {
    const { userId, tasks } = event.payload || event.data || {};
    if (!userId || !tasks || tasks.length === 0) {
      console.error('handleTasksDueSoon: Datos incompletos en el evento');
      return;
    }
    
    await this.processNotification(userId, TaskEvents.DUE_SOON, { tasks }, true);
  }

  /**
   * Manejador para el evento de solicitud de restablecimiento de contraseña
   * @param {Object} event - Evento de solicitud de restablecimiento
   */
  async handlePasswordResetRequested(event) {
    const { userId, resetToken, expiresIn } = event.payload || event.data || {};
    if (!userId || !resetToken) {
      console.error('handlePasswordResetRequested: Datos incompletos en el evento');
      return;
    }
    
    await this.processNotification(userId, AuthEvents.PASSWORD_RESET_REQUESTED, { resetToken, expiresIn }, true);
  }

  /**
   * Manejador para el evento de cambio de contraseña
   * @param {Object} event - Evento de cambio de contraseña
   */
  async handlePasswordChanged(event) {
    const { userId, changedAt } = event.payload || event.data || {};
    if (!userId) {
      console.error('handlePasswordChanged: No se encontró userId en el evento');
      return;
    }
    
    await this.processNotification(userId, AuthEvents.PASSWORD_CHANGED, { changedAt: changedAt || new Date() }, true);
  }

  /**
   * Manejador para el evento de nuevo inicio de sesión
   * @param {Object} event - Evento de nuevo inicio de sesión
   */
  async handleNewLogin(event) {
    const { userId, device, location, ip } = event.payload || event.data || {};
    if (!userId) {
      console.error('handleNewLogin: No se encontró userId en el evento');
      return;
    }
    
    await this.processNotification(userId, AuthEvents.NEW_LOGIN, { 
      device: device || 'Dispositivo desconocido', 
      location: location || 'Ubicación desconocida', 
      ip: ip || 'IP desconocida', 
      time: new Date() 
    });
  }

  /**
   * Manejador para el evento de intento de inicio de sesión sospechoso
   * @param {Object} event - Evento de intento sospechoso
   */
  async handleSuspiciousLoginAttempt(event) {
    const { userId, attempt } = event.payload || event.data || {};
    if (!userId) {
      console.error('handleSuspiciousLoginAttempt: No se encontró userId en el evento');
      return;
    }
    
    await this.processNotification(userId, AuthEvents.SUSPICIOUS_LOGIN_ATTEMPT, { 
      attempt: attempt || {
        device: 'Dispositivo desconocido',
        location: 'Ubicación desconocida',
        ip: 'IP desconocida',
        time: new Date()
      }
    }, true);
  }
}

module.exports = { EmailNotificationSubscriber };
